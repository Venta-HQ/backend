import { ErrorCode, ErrorsMap, interpolateMessage } from './errorcodes';

export enum ErrorType {
	INTERNAL = 'INTERNAL',
	NOT_FOUND = 'NOT_FOUND',
	UNAUTHORIZED = 'UNAUTHORIZED',
	VALIDATION = 'VALIDATION',
	EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
	FORBIDDEN = 'FORBIDDEN',
}

export class AppError extends Error {
	constructor(
		public readonly type: ErrorType,
		public readonly code: ErrorCode,
		public readonly context?: Record<string, unknown>,
	) {
		super(interpolateMessage(ErrorsMap[code], context));
		this.name = 'AppError';
	}

	static validation(code: ErrorCode, context?: Record<string, unknown>) {
		return new AppError(ErrorType.VALIDATION, code, context);
	}

	static internal(code: ErrorCode, context?: Record<string, unknown>) {
		return new AppError(ErrorType.INTERNAL, code, context);
	}

	static notFound(code: ErrorCode, context?: Record<string, unknown>) {
		return new AppError(ErrorType.NOT_FOUND, code, context);
	}

	static unauthorized(code: ErrorCode, context?: Record<string, unknown>) {
		return new AppError(ErrorType.UNAUTHORIZED, code, context);
	}

	static externalService(code: ErrorCode, context?: Record<string, unknown>) {
		return new AppError(ErrorType.EXTERNAL_SERVICE, code, context);
	}
}
