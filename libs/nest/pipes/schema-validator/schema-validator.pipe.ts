import { ZodError, ZodSchema } from 'zod';
import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';

export class SchemaValidatorPipe implements PipeTransform {
	constructor(private schema: ZodSchema) {}

	transform(value: unknown, _metadata: ArgumentMetadata) {
		try {
			return this.schema.parse(value);
		} catch (error) {
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
