import { Response } from 'express';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AppError, decodeGrpcError, ErrorCodes, mapGrpcCodeToAppErrorFallback } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
	constructor(
		private readonly configService: ConfigService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(AppExceptionFilter.name);
	}

	catch(exception: unknown, host: ArgumentsHost) {
		const contextType = host.getType();

		// Convert to AppError if it's not already
		const appError = this.convertToAppError(exception, host);

		// Add domain context to all errors for better debugging and monitoring
		this.addDomainContext(appError);

		// Log unhandled exceptions with context
		try {
			if (contextType === 'http') {
				const http = host.switchToHttp();
				const req = http.getRequest();
				const method = req?.method;
				const url = req?.url;
				const requestId = req?.headers?.['x-request-id'] as string | undefined;

				this.logger.error(`Unhandled error during HTTP request ${method} ${url}`, this.extractStack(exception), {
					errorCode: (appError as any)?.errorCode,
					errorType: (appError as any)?.errorType,
					path: url,
					requestId,
				});
			} else {
				this.logger.error('Unhandled error in application', this.extractStack(exception), {
					errorCode: (appError as any)?.errorCode,
					errorType: (appError as any)?.errorType,
					contextType,
				});
			}
		} catch {}

		switch (contextType) {
			case 'http':
				return this.handleHttpException(appError, host);
			default:
				throw appError;
		}
	}

	private addDomainContext(error: AppError): void {
		// Add domain context to all errors for better debugging and monitoring
		const domain = this.configService.get<string>('DOMAIN');
		if (domain && !(error as any).domain) {
			(error as any).domain = domain;
		}
	}

	private extractStack(exception: unknown): string | undefined {
		if (exception && typeof exception === 'object') {
			const err: any = exception as any;
			if (typeof err.stack === 'string') return err.stack;
			if (err instanceof HttpException) {
				try {
					return JSON.stringify(err.getResponse());
				} catch {
					return undefined;
				}
			}
		}
		return undefined;
	}

	private convertToAppError(exception: unknown, _host: ArgumentsHost): AppError {
		// If it's already an AppError, return it
		if (exception instanceof AppError) {
			return exception;
		}

		// If it's a NestJS exception, convert it
		if (exception instanceof HttpException) {
			const response = exception.getResponse() as any;
			const status = exception.getStatus();

			// Check if this HttpException was created from an AppError
			if (response && response.error && response.error.type && response.error.code) {
				// This is an HttpException created from an AppError, reconstruct it
				const appError = AppError.internal(response.error.code, {
					...response.error.details,
					path: response.error.path,
					requestId: response.error.requestId,
				});
				// Override the timestamp with the original one
				Object.defineProperty(appError, 'timestamp', {
					configurable: false,
					value: response.error.timestamp,
					writable: false,
				});
				return appError;
			}

			// Determine error code based on status code
			switch (status) {
				case 400:
					return AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
						field: 'request', // Generic field for HTTP validation errors
					});
				case 401:
					return AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED);
				case 403:
					return AppError.forbidden(ErrorCodes.ERR_INSUFFICIENT_PERMISSIONS, {
						resource: 'request', // Generic resource for HTTP forbidden errors
					});
				case 404:
					return AppError.notFound(ErrorCodes.ERR_RESOURCE_NOT_FOUND, {
						resourceType: 'endpoint',
						resourceId: 'request',
					});
				case 409:
					return AppError.validation(ErrorCodes.ERR_RESOURCE_EXISTS, {
						resourceType: 'resource',
						resourceId: 'request',
					});
				case 429:
					return AppError.rateLimit(ErrorCodes.ERR_RATE_LIMIT_EXCEEDED, {
						retryAfterSeconds: 60, // Default retry time
					});
				case 502:
					return AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE_ERROR, {
						service: 'external',
					});
				default:
					return AppError.internal(ErrorCodes.ERR_INTERNAL);
			}
		}

		// Handle gRPC-like errors thrown by client Observables via shared decoder
		if (typeof exception === 'object' && exception !== null && 'code' in (exception as any)) {
			const decoded = decodeGrpcError(exception);
			if (decoded) return decoded;
			return mapGrpcCodeToAppErrorFallback((exception as any)?.code, (exception as any)?.message);
		}

		if (exception instanceof RpcException) {
			const decoded = decodeGrpcError(exception.getError());
			if (decoded) return decoded;
			return AppError.internal(ErrorCodes.ERR_INTERNAL);
		}

		if (exception instanceof WsException) {
			return AppError.internal(ErrorCodes.ERR_WEBSOCKET_ERROR, {
				operation: 'websocket_operation',
			});
		}

		// For unknown errors, create a generic internal error
		if (exception instanceof Error) {
			return AppError.internal(ErrorCodes.ERR_INTERNAL);
		}

		return AppError.internal(ErrorCodes.ERR_UNKNOWN);
	}

	private handleHttpException(error: AppError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		// Add request context to error
		(error as any).path = request.url;
		(error as any).requestId = request.headers['x-request-id'] as string;

		const httpException = (error as any).toHttpException();
		const status = httpException.getStatus();
		const responseBody = httpException.getResponse();

		// Log the outgoing error response for visibility
		try {
			const isProd = this.configService.get('NODE_ENV') === 'production';
			const logData: Record<string, any> = {
				status,
				path: request.url,
			};
			if (!isProd) {
				logData.responseBody = responseBody;
			}
			this.logger.debug('Sending HTTP error response', logData);
		} catch {}

		response.status(status).json(responseBody);
	}
}
