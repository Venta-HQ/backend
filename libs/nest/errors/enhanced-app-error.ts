import { ErrorType } from './app-error';
import { AvailableErrorCodes, ErrorContextMap, getErrorSchema } from './enhanced-error-schemas';
import { interpolateMessage } from './errorcodes';

/**
 * Enhanced AppError class with improved type safety and intellisense.
 * Uses static methods for consistent error creation patterns.
 *
 * Usage:
 * - EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, { fields: ['name'] })
 * - EnhancedAppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, { userId: '123' })
 * - EnhancedAppError.unauthorized(ErrorCodes.ERR_INSUFFICIENT_PERMISSIONS, {})
 */
export class EnhancedAppError<T extends AvailableErrorCodes = AvailableErrorCodes> extends Error {
	public readonly errorCode: T;
	public readonly errorType: ErrorType;
	public readonly context: ErrorContextMap[T];
	public readonly interpolatedMessage: string;

	private constructor(errorType: ErrorType, errorCode: T, context: ErrorContextMap[T]) {
		// Get the message template and interpolate with context
		const schema = getErrorSchema(errorCode);
		const message = interpolateMessage(schema._message, context as any);

		super(message);

		this.name = 'EnhancedAppError';
		this.errorCode = errorCode;
		this.errorType = errorType;
		this.context = context;
		this.interpolatedMessage = message;

		// Maintain prototype chain for instanceof checks
		Object.setPrototypeOf(this, EnhancedAppError.prototype);
	}

	/**
	 * Create a validation error - for input validation, malformed data, business rule violations
	 *
	 * Hover over your error code to see the exact message template and required context!
	 * The context parameter is strictly typed to match the schema requirements.
	 *
	 * @example
	 * EnhancedAppError.validation(ErrorCodes.ERR_USER_INCOMPLETE, { fields: ['name', 'email'] })
	 * EnhancedAppError.validation(ErrorCodes.ERR_INVALID_EMAIL, { email: 'invalid@' })
	 */
	static validation<T extends AvailableErrorCodes>(errorCode: T, context: ErrorContextMap[T]): EnhancedAppError<T> {
		return new EnhancedAppError(ErrorType.VALIDATION, errorCode, context);
	}

	/**
	 * Create an internal server error - for unexpected system failures, unhandled exceptions
	 *
	 * @example
	 * EnhancedAppError.internal('ERR_DB_CONNECTION', {})
	 * EnhancedAppError.internal('ERR_LOC_UPDATE_FAILED', { vendorId: '123' })
	 */
	static internal<T extends AvailableErrorCodes>(errorCode: T, context: ErrorContextMap[T]): EnhancedAppError<T> {
		return new EnhancedAppError(ErrorType.INTERNAL, errorCode, context);
	}

	/**
	 * Create a not found error - for missing resources, invalid IDs
	 *
	 * @example
	 * EnhancedAppError.notFound('ERR_USER_NOT_FOUND', { userId: '123' })
	 * EnhancedAppError.notFound('ERR_VENDOR_NOT_FOUND', { vendorId: '456' })
	 */
	static notFound<T extends AvailableErrorCodes>(errorCode: T, context: ErrorContextMap[T]): EnhancedAppError<T> {
		return new EnhancedAppError(ErrorType.NOT_FOUND, errorCode, context);
	}

	/**
	 * Create an unauthorized error - for authentication failures, invalid tokens
	 *
	 * @example
	 * EnhancedAppError.unauthorized('ERR_INVALID_TOKEN', {})
	 * EnhancedAppError.unauthorized('ERR_COMM_WEBHOOK_SIGNATURE', { source: 'clerk' })
	 */
	static unauthorized<T extends AvailableErrorCodes>(errorCode: T, context: ErrorContextMap[T]): EnhancedAppError<T> {
		return new EnhancedAppError(ErrorType.UNAUTHORIZED, errorCode, context);
	}

	/**
	 * Create an external service error - for third-party API failures, network issues, timeouts
	 *
	 * @example
	 * EnhancedAppError.externalService('ERR_INFRA_UPLOAD_FAILED', { filename: 'doc.pdf', message: 'timeout' })
	 * EnhancedAppError.externalService('ERR_COMM_NOTIFICATION_FAILED', { recipient: 'user@example.com' })
	 */
	static externalService<T extends AvailableErrorCodes>(
		errorCode: T,
		context: ErrorContextMap[T],
	): EnhancedAppError<T> {
		return new EnhancedAppError(ErrorType.EXTERNAL_SERVICE, errorCode, context);
	}

	/**
	 * Create a forbidden error - for authorization failures, insufficient permissions
	 *
	 * @example
	 * EnhancedAppError.forbidden('ERR_INSUFFICIENT_PERMISSIONS', {})
	 * EnhancedAppError.forbidden('ERR_VENDOR_UNAUTHORIZED', { userId: '123', vendorId: '456' })
	 */
	static forbidden<T extends AvailableErrorCodes>(errorCode: T, context: ErrorContextMap[T]): EnhancedAppError<T> {
		return new EnhancedAppError(ErrorType.FORBIDDEN, errorCode, context);
	}

	/**
	 * Convert to plain object for serialization
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			errorCode: this.errorCode,
			errorType: this.errorType,
			context: this.context,
			stack: this.stack,
		};
	}
}
