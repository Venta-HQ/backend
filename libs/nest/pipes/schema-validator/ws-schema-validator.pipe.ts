import { ZodError, ZodSchema } from 'zod';
import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

export class WsSchemaValidatorPipe implements PipeTransform {
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
				throw new WsException({ validationErrors: formattedErrors });
			} else {
				throw new WsException(`Validation failed`);
			}
		}
	}
}
