/**
 * AppError class implementation
 * Type-safe error handling with static factory methods
 */

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
}
