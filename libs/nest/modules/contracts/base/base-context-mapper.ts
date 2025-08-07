import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { Logger } from '@nestjs/common';

/**
 * Base Context Mapper
 *
 * Provides common infrastructure for context mappers across all domains.
 * Extend this class to create domain-specific context mappers.
 */
export abstract class BaseContextMapper {
	protected readonly logger: Logger;

	constructor(loggerName: string) {
		this.logger = new Logger(loggerName);
	}

	// ============================================================================
	// Core Infrastructure Methods
	// ============================================================================

	/**
	 * Create validation error
	 */
	protected createValidationError(message: string, details: Record<string, any>): AppError {
		return new AppError(ErrorType.VALIDATION, ErrorCodes.VALIDATION_ERROR, message, details);
	}

	/**
	 * Create translation error
	 */
	protected createTranslationError(message: string, details: Record<string, any>): AppError {
		return new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_FORMAT, message, details);
	}

	// ============================================================================
	// Logging Infrastructure
	// ============================================================================

	/**
	 * Log translation start
	 */
	protected logTranslationStart(operation: string, context: Record<string, any>) {
		this.logger.log(`Starting ${operation}`, {
			operation,
			sourceDomain: this.getDomain(),
			targetDomain: this.getTargetDomain(),
			context,
		});
	}

	/**
	 * Log translation success
	 */
	protected logTranslationSuccess(operation: string, result: any) {
		this.logger.log(`Completed ${operation} successfully`, {
			operation,
			sourceDomain: this.getDomain(),
			targetDomain: this.getTargetDomain(),
			resultType: typeof result,
		});
	}

	/**
	 * Log translation error
	 */
	protected logTranslationError(operation: string, error: any, context?: Record<string, any>) {
		this.logger.error(`Failed ${operation}`, {
			operation,
			sourceDomain: this.getDomain(),
			targetDomain: this.getTargetDomain(),
			error: error.message || error,
			context,
		});
	}

	// ============================================================================
	// Abstract Methods - Must be implemented by subclasses
	// ============================================================================

	/**
	 * Get the source domain name
	 */
	abstract getDomain(): string;

	/**
	 * Get the target domain name
	 */
	abstract getTargetDomain(): string;

	/**
	 * Validate source domain data
	 */
	abstract validateSourceData(data: any): boolean;

	/**
	 * Validate target domain data
	 */
	abstract validateTargetData(data: any): boolean;
}
