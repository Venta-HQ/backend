import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { Logger } from '@nestjs/common';

/**
 * Base Anti-Corruption Layer
 *
 * Provides common infrastructure for anti-corruption layers across all domains.
 * Extend this class to create domain-specific anti-corruption layers.
 */
export abstract class BaseAntiCorruptionLayer {
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
	 * Create extraction error
	 */
	protected createExtractionError(message: string, details: Record<string, any>): AppError {
		return new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_FORMAT, message, details);
	}

	/**
	 * Create transformation error
	 */
	protected createTransformationError(message: string, details: Record<string, any>): AppError {
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
			externalService: this.getExternalService(),
			domain: this.getDomain(),
			context,
		});
	}

	/**
	 * Log translation success
	 */
	protected logTranslationSuccess(operation: string, result: any) {
		this.logger.log(`Completed ${operation} successfully`, {
			operation,
			externalService: this.getExternalService(),
			domain: this.getDomain(),
			resultType: typeof result,
		});
	}

	/**
	 * Log translation error
	 */
	protected logTranslationError(operation: string, error: any, context?: Record<string, any>) {
		this.logger.error(`Failed ${operation}`, {
			operation,
			externalService: this.getExternalService(),
			domain: this.getDomain(),
			error: error.message || error,
			context,
		});
	}

	// ============================================================================
	// Abstract Methods - Must be implemented by subclasses
	// ============================================================================

	/**
	 * Get the external service name
	 */
	abstract getExternalService(): string;

	/**
	 * Get the domain name
	 */
	abstract getDomain(): string;

	/**
	 * Validate external service data
	 */
	abstract validateExternalData(data: any): boolean;

	/**
	 * Validate domain data
	 */
	abstract validateDomainData(data: any): boolean;
}
