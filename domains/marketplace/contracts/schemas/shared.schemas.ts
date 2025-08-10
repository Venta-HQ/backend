import { z } from 'zod';
import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * Shared validation schemas and utilities for domain ACL validation
 */

// Common validation patterns
export const nonEmptyString = z.string().min(1, 'Required field cannot be empty');
export const trimmedNonEmptyString = z.string().refine((str) => str.trim().length > 0, {
	message: 'Required field cannot be empty',
});

export const emailSchema = z.string().email('Valid email address is required');
export const optionalEmailSchema = z.string().email('Valid email address is required').optional();

// UUID validation
export const uuidSchema = z.string().uuid('Must be a valid UUID');

// Coordinate validation
export const coordinateSchema = z.object({
	lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
	lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
});

export const grpcCoordinateSchema = z.object({
	lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
	lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
});

/**
 * Utility function to safely parse Zod schemas and convert errors to AppError
 */
export function parseWithAppError<T>(
	schema: z.ZodSchema<T>,
	data: unknown,
	context?: { field?: string; operation?: string },
): T {
	try {
		return schema.parse(data);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const firstError = error.errors[0];
			const field = context?.field || firstError.path.join('.');

			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field,
				message: firstError.message,
				operation: context?.operation || 'validation',
				errors: error.errors.map((err) => ({
					message: err.message,
					path: err.path.join('.'),
					code: err.code,
				})),
			});
		}

		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: context?.field || 'unknown',
			message: error instanceof Error ? error.message : 'Unknown validation error',
			operation: context?.operation || 'validation',
		});
	}
}

/**
 * Utility function to safely validate Zod schemas (for validate methods)
 */
export function validateWithAppError<T>(
	schema: z.ZodSchema<T>,
	data: unknown,
	context?: { field?: string; operation?: string },
): void {
	parseWithAppError(schema, data, context);
}
