import { ZodError, ZodSchema } from 'zod';
import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';

export class SchemaValidatorPipe implements PipeTransform {
	private readonly logger = new Logger().setContext(SchemaValidatorPipe.name);

	constructor(private schema: ZodSchema) {}

	transform(value: unknown, metadata: ArgumentMetadata) {
		try {
			return this.schema.parse(value);
		} catch (error) {
			this.logger.error('Schema validation failed', error instanceof Error ? error.stack : undefined, {
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

				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field,
					errors: formattedErrors,
				});
			}

			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: metadata.data,
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
