import { Response } from 'express';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AppError } from './app-error';
import { ErrorCodes } from './errorcodes';

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
						message: response.message || exception.message || 'Validation error',
						originalError: response,
						statusCode: status,
					});
				case 401:
					return AppError.unauthorized(ErrorCodes.ERR_UNAUTHORIZED, {
						message: response.message || exception.message || 'Unauthorized',
						originalError: response,
						statusCode: status,
					});
				case 403:
					return AppError.unauthorized(ErrorCodes.ERR_INSUFFICIENT_PERMISSIONS, {
						message: response.message || exception.message || 'Forbidden',
						originalError: response,
						statusCode: status,
					});
				case 404:
					return AppError.notFound(ErrorCodes.ERR_RESOURCE_NOT_FOUND, {
						message: response.message || exception.message || 'Not found',
						originalError: response,
						statusCode: status,
					});
				case 409:
					return AppError.validation(ErrorCodes.ERR_RESOURCE_EXISTS, {
						message: response.message || exception.message || 'Resource already exists',
						originalError: response,
						statusCode: status,
					});
				case 429:
					return AppError.validation(ErrorCodes.ERR_RATE_LIMIT, {
						message: response.message || exception.message || 'Rate limit exceeded',
						originalError: response,
						statusCode: status,
					});
				case 502:
					return AppError.externalService(ErrorCodes.ERR_SERVICE_UNAVAILABLE, {
						message: response.message || exception.message || 'External service error',
						originalError: response,
						statusCode: status,
					});
				default:
					return AppError.internal(ErrorCodes.ERR_INTERNAL, {
						message: response.message || exception.message || 'Internal server error',
						originalError: response,
						statusCode: status,
					});
			}
		}

		if (exception instanceof RpcException) {
			const error = exception.getError() as any;
			return AppError.internal(ErrorCodes.ERR_INTERNAL, {
				message: error.message || 'gRPC error',
				code: error.code,
				originalError: error,
			});
		}

		if (exception instanceof WsException) {
			const error = exception.getError() as any;
			return AppError.internal(ErrorCodes.ERR_INTERNAL, {
				message: error.message || 'WebSocket error',
				originalError: error,
			});
		}

		// For unknown errors, create a generic internal error
		if (exception instanceof Error) {
			return AppError.internal(ErrorCodes.ERR_INTERNAL, {
				message: exception.message,
				stack: exception.stack,
			});
		}

		return AppError.internal(ErrorCodes.ERR_UNKNOWN, {
			message: 'An unknown error occurred',
			originalError: exception,
		});
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
		// Error is created but not used directly - it's thrown by the framework
		grpcException.getError() as any;

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
		const wsError = wsException.getError() as any;

		// Emit error to WebSocket client
		client.emit('error', wsError);
	}
}
