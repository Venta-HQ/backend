import { Response } from 'express';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AppError } from './app-error';
import { ErrorCodes } from './error-definitions';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
	constructor(private readonly configService: ConfigService) {}

	catch(exception: unknown, host: ArgumentsHost) {
		const contextType = host.getType();

		// Convert to AppError if it's not already
		const appError = this.convertToAppError(exception, host);

		// Add domain context to all errors for better debugging and monitoring
		this.addDomainContext(appError);

		switch (contextType) {
			case 'http':
				return this.handleHttpException(appError, host);
			case 'rpc':
				return this.handleGrpcException(appError, host);
			case 'ws':
				return this.handleWsException(appError, host);
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

		if (exception instanceof RpcException) {
			const rpcError = exception.getError() as any;

			// Try to extract AppError details from RpcException
			if (rpcError && rpcError.details) {
				const details = rpcError.details;

				// Check if details contains AppError structure (could be object or JSON string)
				let parsedDetails = details;
				if (typeof details === 'string') {
					try {
						parsedDetails = JSON.parse(details);
					} catch (parseError) {
						// Details might not be JSON, continue with original
					}
				}

				// Check if this contains AppError structure
				if (parsedDetails && parsedDetails.errorCode && parsedDetails.errorType) {
					const appError = AppError.internal(parsedDetails.errorCode, parsedDetails.data || {});

					// Restore original error type and message
					Object.defineProperties(appError, {
						errorType: { value: parsedDetails.errorType, writable: false },
						message: { value: rpcError.message || parsedDetails.message, writable: false },
						timestamp: { value: parsedDetails.timestamp || new Date().toISOString(), writable: false },
					});

					return appError;
				}
			}

			// Fallback to generic internal error if we can't parse the details
			return AppError.internal(ErrorCodes.ERR_INTERNAL, {
				originalRpcCode: rpcError?.code,
				originalMessage: rpcError?.message || exception.message,
			});
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

		response.status(status).json(responseBody);
	}

	private handleGrpcException(error: AppError, host: ArgumentsHost) {
		const ctx = host.switchToRpc();
		const context = ctx.getContext();

		// Add context information if available
		if (context && context.get) {
			(error as any).requestId = context.get('request-id');
		}

		const grpcException = (error as any).toGrpcException();

		// For gRPC, we need to throw the exception to be handled by the gRPC framework
		throw grpcException;
	}

	private handleWsException(error: AppError, host: ArgumentsHost) {
		const ctx = host.switchToWs();
		const client = ctx.getClient();
		const data = ctx.getData();

		// Add context information if available
		if (data && data.requestId) {
			(error as any).requestId = data.requestId;
		}

		const wsException = (error as any).toWsException();
		const wsError = wsException.getError();

		// Emit error to WebSocket client
		client.emit('error', wsError);
	}
}
