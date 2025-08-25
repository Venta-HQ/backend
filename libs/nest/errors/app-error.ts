/**
 * AppError class implementation
 * Type-safe error handling with static factory methods
 */

import { HttpException, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { AvailableErrorCodes, ERROR_MESSAGES, ErrorDataMap, ErrorType, OptionalDataParam } from './error-definitions';

/**
 * App error class with type-safe data objects
 */
export class AppError<T extends AvailableErrorCodes = AvailableErrorCodes> extends Error {
	public readonly errorCode: T;
	public readonly errorType: ErrorType;
	public readonly data: ErrorDataMap[T];

	private constructor(errorType: ErrorType, errorCode: T, data: ErrorDataMap[T]) {
		super(ERROR_MESSAGES[errorCode]);
		this.name = 'AppError';
		this.errorCode = errorCode;
		this.errorType = errorType;
		this.data = data;
		Object.setPrototypeOf(this, AppError.prototype);
	}

	// Static factory methods for clean error creation with optional data parameters
	static validation<T extends AvailableErrorCodes>(errorCode: T, ...args: OptionalDataParam<T>): AppError<T> {
		const data = args[0] ?? ({} as ErrorDataMap[T]);
		return new AppError(ErrorType.VALIDATION, errorCode, data);
	}

	static notFound<T extends AvailableErrorCodes>(errorCode: T, ...args: OptionalDataParam<T>): AppError<T> {
		const data = args[0] ?? ({} as ErrorDataMap[T]);
		return new AppError(ErrorType.NOT_FOUND, errorCode, data);
	}

	static unauthorized<T extends AvailableErrorCodes>(errorCode: T, ...args: OptionalDataParam<T>): AppError<T> {
		const data = args[0] ?? ({} as ErrorDataMap[T]);
		return new AppError(ErrorType.UNAUTHORIZED, errorCode, data);
	}

	static forbidden<T extends AvailableErrorCodes>(errorCode: T, ...args: OptionalDataParam<T>): AppError<T> {
		const data = args[0] ?? ({} as ErrorDataMap[T]);
		return new AppError(ErrorType.FORBIDDEN, errorCode, data);
	}

	static internal<T extends AvailableErrorCodes>(errorCode: T, ...args: OptionalDataParam<T>): AppError<T> {
		const data = args[0] ?? ({} as ErrorDataMap[T]);
		return new AppError(ErrorType.INTERNAL, errorCode, data);
	}

	static externalService<T extends AvailableErrorCodes>(errorCode: T, ...args: OptionalDataParam<T>): AppError<T> {
		const data = args[0] ?? ({} as ErrorDataMap[T]);
		return new AppError(ErrorType.EXTERNAL_SERVICE, errorCode, data);
	}

	static rateLimit<T extends AvailableErrorCodes>(errorCode: T, ...args: OptionalDataParam<T>): AppError<T> {
		const data = args[0] ?? ({} as ErrorDataMap[T]);
		return new AppError(ErrorType.RATE_LIMIT, errorCode, data);
	}

	/**
	 * Converts AppError to HttpException for HTTP transport
	 */
	toHttpException(): HttpException {
		const statusCode = this.getHttpStatusCode();
		const response = {
			message: this.interpolateMessage(),
			errorCode: this.errorCode,
			errorType: this.errorType,
			data: this.data,
		};

		return new HttpException(response, statusCode);
	}

	/**
	 * Converts AppError to RpcException for gRPC transport
	 */
	toGrpcException(): RpcException {
		// Delegate to the shared encoder for consistent gRPC errors
		// Import lazily to avoid circular deps
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { encodeAppErrorToGrpc } = require('./grpc-error.codec');
		const { code, message, metadata } = encodeAppErrorToGrpc(this as any);
		const err: any = new Error(message);
		err.code = code;
		err.details = message;
		err.metadata = metadata;
		return new RpcException(err);
	}

	/**
	 * Converts AppError to WsException for WebSocket transport
	 */
	toWsException(): WsException {
		const response = {
			message: this.message,
			errorCode: this.errorCode,
			errorType: this.errorType,
			data: this.data,
		};

		return new WsException(response);
	}

	/**
	 * Maps ErrorType to HTTP status code
	 */
	private getHttpStatusCode(): HttpStatus {
		switch (this.errorType) {
			case ErrorType.VALIDATION:
				return HttpStatus.BAD_REQUEST;
			case ErrorType.NOT_FOUND:
				return HttpStatus.NOT_FOUND;
			case ErrorType.UNAUTHORIZED:
				return HttpStatus.UNAUTHORIZED;
			case ErrorType.FORBIDDEN:
				return HttpStatus.FORBIDDEN;
			case ErrorType.RATE_LIMIT:
				return HttpStatus.TOO_MANY_REQUESTS;
			case ErrorType.INTERNAL:
				return HttpStatus.INTERNAL_SERVER_ERROR;
			case ErrorType.EXTERNAL_SERVICE:
				return HttpStatus.BAD_GATEWAY;
			default:
				return HttpStatus.INTERNAL_SERVER_ERROR;
		}
	}

	/**
	 * Interpolates placeholders in the error message with fields from this.data
	 * Example: 'Database operation failed: {operation}' + { operation: 'create' }
	 * -> 'Database operation failed: create'
	 */
	private interpolateMessage(): string {
		try {
			const template = (ERROR_MESSAGES as any)?.[this.errorCode] || this.message;
			if (!template || typeof template !== 'string') return this.message;
			if (!this.data || typeof this.data !== 'object') return template;
			return template.replace(/\{(\w+)\}/g, (_match: string, key: string) => {
				const value = (this.data as any)?.[key];
				return value !== undefined && value !== null ? String(value) : `{${key}}`;
			});
		} catch {
			return this.message;
		}
	}

	// gRPC status mapping handled by shared encoder
}
