import { ZodError, ZodSchema } from 'zod';
import { HttpError } from '@app/nest/errors';
import { ArgumentMetadata, Logger, PipeTransform } from '@nestjs/common';

export class SchemaValidatorPipe implements PipeTransform {
	private readonly logger = new Logger(SchemaValidatorPipe.name);

	constructor(private schema: ZodSchema) {}
	transform(value: unknown, _metadata: ArgumentMetadata) {
		try {
			return this.schema.parse(value);
		} catch (error) {
			this.logger.error(error);
			if (error instanceof ZodError) {
				const formattedErrors = error.errors.map((err) => ({
					message: err.message,
					path: err.path.join('.'),
				}));
				throw new HttpError(
					'VALIDATION_ERROR',
					{
						message: 'Validation failed',
					},
					null,
					formattedErrors,
				);
			} else {
				throw new HttpError('VALIDATION_ERROR', {
					message: 'Validation failed',
				});
			}
		}
	}
}
