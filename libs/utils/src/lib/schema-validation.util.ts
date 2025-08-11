import { ZodError, ZodSchema } from 'zod';
import { AppError, ErrorCodes } from '@venta/nest/errors';

export function validateSchema<T>(schema: ZodSchema<T>, data: T): T {
	try {
		return schema.parse(data);
	} catch (error) {
		if (error instanceof ZodError) {
			const formattedErrors = error.errors.map((err) => ({
				message: err.message,
				path: err.path.join('.'),
				code: err.code,
			}));

			const firstError = error.errors[0];
			const field = firstError.path.join('.');

			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field,
				errors: formattedErrors,
			});
		}

		throw AppError.internal(ErrorCodes.ERR_INTERNAL, {
			message: 'Unknown error',
			details: error,
		});
	}
}
