import { ZodError, ZodSchema } from 'zod';
import { ArgumentMetadata, BadRequestException, Logger, PipeTransform } from '@nestjs/common';

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
				throw new BadRequestException({ validationErrors: formattedErrors });
			} else {
				throw new BadRequestException(`Validation failed`);
			}
		}
	}
}
