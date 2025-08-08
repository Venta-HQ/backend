import { ZodError, ZodSchema } from 'zod';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { ArgumentMetadata, Logger, PipeTransform } from '@nestjs/common';

export class SchemaValidatorPipe implements PipeTransform {
	private readonly logger = new Logger(SchemaValidatorPipe.name);

	constructor(private schema: ZodSchema) {}

	transform(value: unknown, metadata: ArgumentMetadata) {
		try {
			return this.schema.parse(value);
		} catch (error) {
			this.logger.error('Schema validation failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
				value,
				type: metadata.type,
				data: metadata.data,
			});

			if (error instanceof ZodError) {
				const formattedErrors = error.errors.map((err) => ({
					message: err.message,
					path: err.path.join('.'),
					code: err.code,
				}));

				const firstError = error.errors[0];
				const field = firstError.path.join('.');

				throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
					field,
					errors: formattedErrors,
				});
			}

			throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
				field: metadata.data,
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
