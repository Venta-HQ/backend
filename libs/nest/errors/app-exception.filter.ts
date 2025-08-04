import { Response } from 'express';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AppError, ErrorType } from './app-error';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		const contextType = host.getType();

		// Convert to AppError if it's not already
		const appError = this.convertToAppError(exception, host);

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
				const appError = new AppError(
					response.error.type as ErrorType,
					response.error.code,
					response.error.message,
					response.error.details,
					response.error.path,
					response.error.requestId
				);
				// Override the timestamp with the original one
				Object.defineProperty(appError, 'timestamp', {
					value: response.error.timestamp,
					writable: false,
					configurable: false
				});
				return appError;
			}
			
			// Determine error type based on status code
			let errorType: ErrorType;
			let code: string;
			
			switch (status) {
				case 400:
					errorType = ErrorType.VALIDATION;
					code = 'VALIDATION_ERROR';
					break;
				case 401:
					errorType = ErrorType.AUTHENTICATION;
					code = 'UNAUTHORIZED';
					break;
				case 403:
					errorType = ErrorType.AUTHORIZATION;
					code = 'FORBIDDEN';
					break;
				case 404:
					errorType = ErrorType.NOT_FOUND;
					code = 'NOT_FOUND';
					break;
				case 409:
					errorType = ErrorType.CONFLICT;
					code = 'CONFLICT';
					break;
				case 429:
					errorType = ErrorType.RATE_LIMIT;
					code = 'RATE_LIMIT';
					break;
				case 502:
					errorType = ErrorType.EXTERNAL_SERVICE;
					code = 'EXTERNAL_SERVICE_ERROR';
					break;
				default:
					errorType = ErrorType.INTERNAL;
					code = 'INTERNAL_ERROR';
			}
			
			return new AppError(
				errorType,
				code,
				response.message || exception.message || 'Internal server error',
				{
					originalError: response,
					statusCode: status,
				}
			);
		}

		if (exception instanceof RpcException) {
			const error = exception.getError() as any;
			return AppError.internal(error.message || 'gRPC error', {
				code: error.code,
				originalError: error,
			});
		}

		if (exception instanceof WsException) {
			const error = exception.getError() as any;
			return AppError.internal(error.message || 'WebSocket error', { originalError: error });
		}

		// For unknown errors, create a generic internal error
		if (exception instanceof Error) {
			return AppError.internal(exception.message, { stack: exception.stack });
		}

		return AppError.internal('An unknown error occurred', { originalError: exception });
	}

	private handleHttpException(error: AppError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		// Add request context to error
		error.path = request.url;
		error.requestId = request.headers['x-request-id'] as string;

		const httpException = error.toHttpException();
		const status = httpException.getStatus();
		const responseBody = httpException.getResponse();

		response.status(status).json(responseBody);
	}

	private handleGrpcException(error: AppError, host: ArgumentsHost) {
		const ctx = host.switchToRpc();
		const context = ctx.getContext();

		// Add context information if available
		if (context && context.get) {
			error.requestId = context.get('request-id');
		}

		const grpcException = error.toGrpcException();
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
			error.requestId = data.requestId;
		}

		const wsException = error.toWsException();
		const wsError = wsException.getError() as any;

		// Emit error to WebSocket client
		client.emit('error', wsError);
	}
} 