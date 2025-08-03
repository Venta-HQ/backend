import { ZodError, ZodSchema } from 'zod';
import { WsError } from '@app/nest/errors';
import { ArgumentMetadata, Logger, PipeTransform } from '@nestjs/common';

export class WsSchemaValidatorPipe implements PipeTransform {
	private readonly logger = new Logger(WsSchemaValidatorPipe.name);
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
				throw new WsError(
					'VALIDATION_ERROR',
					{
						message: 'Validation failed',
					},
					null,
					formattedErrors,
				);
			} else {
				throw new WsError('VALIDATION_ERROR', {
					message: 'Validation failed',
				});
			}
		}
	}
}
