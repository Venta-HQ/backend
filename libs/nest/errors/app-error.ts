import { status } from '@grpc/grpc-js';
import { HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WsException } from '@nestjs/websockets';
import { ErrorCodes, interpolateMessage } from './errorcodes';

export enum ErrorType {
	AUTHENTICATION = 'AUTHENTICATION',
	AUTHORIZATION = 'AUTHORIZATION',
	CONFLICT = 'CONFLICT',
	EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
	INTERNAL = 'INTERNAL',
	NOT_FOUND = 'NOT_FOUND',
	RATE_LIMIT = 'RATE_LIMIT',
	VALIDATION = 'VALIDATION',
}

export interface ErrorDetails {
	code: string;
	details?: Record<string, any>;
	message: string;
	path?: string;
	requestId?: string;
	timestamp: string;
	type: ErrorType;
}

export class AppError extends Error {
	public readonly type: ErrorType;
	public readonly code: string;
	public readonly details?: Record<string, any>;
	public readonly timestamp: string;
	public path?: string;
	public requestId?: string;

	constructor(
		type: ErrorType,
		code: string,
		message: string,
		details?: Record<string, any>,
		path?: string,
		requestId?: string,
	) {
		super(message);
		this.type = type;
		this.code = code;
		this.details = details;
		this.timestamp = new Date().toISOString();
		this.path = path;
		this.requestId = requestId;
	}

	// Convert to HTTP exception
	toHttpException(): HttpException {
		const httpStatus = this.getHttpStatus();
		return new HttpException(
			{
				error: {
					code: this.code,
					details: this.details,
					message: this.message,
					path: this.path,
					requestId: this.requestId,
					timestamp: this.timestamp,
					type: this.type,
				},
			},
			httpStatus,
		);
	}

	// Convert to gRPC exception
	toGrpcException(): RpcException {
		const grpcCode = this.getGrpcStatus();
		return new RpcException({
			code: grpcCode,
			details: JSON.stringify({
				code: this.code,
				details: this.details,
				path: this.path,
				requestId: this.requestId,
				timestamp: this.timestamp,
				type: this.type,
			}),
			message: this.message,
		});
	}

	// Convert to WebSocket exception
	toWsException(): WsException {
		return new WsException({
			code: this.code,
			details: this.details,
			message: this.message,
			path: this.path,
			requestId: this.requestId,
			timestamp: this.timestamp,
			type: this.type,
		});
	}

	// Get HTTP status code
	private getHttpStatus(): number {
		switch (this.type) {
			case ErrorType.VALIDATION:
				return 400;
			case ErrorType.AUTHENTICATION:
				return 401;
			case ErrorType.AUTHORIZATION:
				return 403;
			case ErrorType.NOT_FOUND:
				return 404;
			case ErrorType.CONFLICT:
				return 409;
			case ErrorType.RATE_LIMIT:
				return 429;
			case ErrorType.EXTERNAL_SERVICE:
				return 502;
			case ErrorType.INTERNAL:
			default:
				return 500;
		}
	}

	// Get gRPC status code
	private getGrpcStatus(): status {
		switch (this.type) {
			case ErrorType.VALIDATION:
				return status.INVALID_ARGUMENT;
			case ErrorType.AUTHENTICATION:
				return status.UNAUTHENTICATED;
			case ErrorType.AUTHORIZATION:
				return status.PERMISSION_DENIED;
			case ErrorType.NOT_FOUND:
				return status.NOT_FOUND;
			case ErrorType.CONFLICT:
				return status.ALREADY_EXISTS;
			case ErrorType.RATE_LIMIT:
				return status.RESOURCE_EXHAUSTED;
			case ErrorType.EXTERNAL_SERVICE:
				return status.UNAVAILABLE;
			case ErrorType.INTERNAL:
			default:
				return status.INTERNAL;
		}
	}

	// Helper function to find error code by message
	private static findErrorCode(message: string): string {
		for (const [code, msg] of Object.entries(ErrorCodes)) {
			if (msg === message) {
				return code;
			}
		}
		// If not found, use a generic code
		return 'UNKNOWN_ERROR';
	}

	// Static factory methods for common errors
	static validation(message: string, details?: Record<string, any>): AppError {
		const interpolatedMessage = interpolateMessage(message, details);
		const code = this.findErrorCode(message);
		return new AppError(ErrorType.VALIDATION, code, interpolatedMessage, details);
	}

	static authentication(message: string, details?: Record<string, any>): AppError {
		const interpolatedMessage = interpolateMessage(message, details);
		const code = this.findErrorCode(message);
		return new AppError(ErrorType.AUTHENTICATION, code, interpolatedMessage, details);
	}

	static authorization(message: string, details?: Record<string, any>): AppError {
		const interpolatedMessage = interpolateMessage(message, details);
		const code = this.findErrorCode(message);
		return new AppError(ErrorType.AUTHORIZATION, code, interpolatedMessage, details);
	}

	static notFound(message: string, details?: Record<string, any>): AppError {
		const interpolatedMessage = interpolateMessage(message, details);
		const code = this.findErrorCode(message);
		return new AppError(ErrorType.NOT_FOUND, code, interpolatedMessage, details);
	}

	static conflict(message: string, details?: Record<string, any>): AppError {
		const interpolatedMessage = interpolateMessage(message, details);
		const code = this.findErrorCode(message);
		return new AppError(ErrorType.CONFLICT, code, interpolatedMessage, details);
	}

	static rateLimit(message: string, details?: Record<string, any>): AppError {
		const interpolatedMessage = interpolateMessage(message, details);
		const code = this.findErrorCode(message);
		return new AppError(ErrorType.RATE_LIMIT, code, interpolatedMessage, details);
	}

	static internal(message: string, details?: Record<string, any>): AppError {
		const interpolatedMessage = interpolateMessage(message, details);
		const code = this.findErrorCode(message);
		return new AppError(ErrorType.INTERNAL, code, interpolatedMessage, details);
	}

	static externalService(message: string, details?: Record<string, any>): AppError {
		const interpolatedMessage = interpolateMessage(message, details);
		const code = this.findErrorCode(message);
		return new AppError(ErrorType.EXTERNAL_SERVICE, code, interpolatedMessage, details);
	}
}
