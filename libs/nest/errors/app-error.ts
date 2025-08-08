import { ErrorCodes } from './errorcodes';

export enum ErrorType {
	INTERNAL = 'INTERNAL',
	NOT_FOUND = 'NOT_FOUND',
	UNAUTHORIZED = 'UNAUTHORIZED',
	VALIDATION = 'VALIDATION',
	EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
}

type ErrorCode = keyof typeof ErrorCodes;

export class AppError extends Error {
	constructor(
		public readonly type: ErrorType,
		public readonly code: ErrorCode,
		message: string,
		public readonly context?: Record<string, unknown>,
	) {
		super(message);
		this.name = 'AppError';
	}

	static validation(code: ErrorCode, message: string, context?: Record<string, unknown>) {
		return new AppError(ErrorType.VALIDATION, code, message, context);
	}

	static internal(code: ErrorCode, message: string, context?: Record<string, unknown>) {
		return new AppError(ErrorType.INTERNAL, code, message, context);
	}

	static notFound(code: ErrorCode, message: string, context?: Record<string, unknown>) {
		return new AppError(ErrorType.NOT_FOUND, code, message, context);
	}

	static unauthorized(code: ErrorCode, message: string, context?: Record<string, unknown>) {
		return new AppError(ErrorType.UNAUTHORIZED, code, message, context);
	}

	static externalService(code: ErrorCode, message: string, context?: Record<string, unknown>) {
		return new AppError(ErrorType.EXTERNAL_SERVICE, code, message, context);
	}
}
