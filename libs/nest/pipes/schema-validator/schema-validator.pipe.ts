import { ZodError, ZodSchema } from 'zod';
import { ArgumentMetadata, Logger, PipeTransform } from '@nestjs/common';
import { AppError, ErrorCodes } from '../../errors';

export class SchemaValidatorPipe implements PipeTransform {
	private readonly logger = new Logger(SchemaValidatorPipe.name);

	constructor(private schema: ZodSchema) {}

	transform(value: unknown, _metadata: ArgumentMetadata | any) {
		try {
			return this.schema.parse(value);
		} catch (error) {
			this.logger.error(error);
			if (error instanceof ZodError) {
				const formattedErrors = error.errors.map((err) => ({
					message: err.message,
					path: err.path.join('.'),
				}));
				const firstError = error.errors[0];
				const field = firstError.path.join('.');

				throw AppError.validation(ErrorCodes.VALIDATION_ERROR, {
					errors: formattedErrors,
					field,
				});
			} else {
				throw AppError.validation(ErrorCodes.VALIDATION_ERROR);
			}
		}
	}
}
