import { AppError, ErrorType } from './app-error';

/**
 * Generic domain error class that can be used for any domain
 * Domain context is automatically appended by the DomainErrorInterceptor
 * Use ErrorCodes from errorcodes.ts for error codes
 */
export class DomainError extends AppError {
	constructor(
		code: string,
		message: string,
		context?: Record<string, any>,
		public domain?: string, // Allow setting domain (will be auto-appended by interceptor)
	) {
		super(ErrorType.INTERNAL, code, message, context);
	}
}
