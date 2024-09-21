import { ZodError, ZodSchema } from 'zod';
import { ArgumentMetadata, Logger, PipeTransform } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

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
				throw new WsException({ validationErrors: formattedErrors });
			} else {
				throw new WsException(`Validation failed`);
			}
		}
	}
}
