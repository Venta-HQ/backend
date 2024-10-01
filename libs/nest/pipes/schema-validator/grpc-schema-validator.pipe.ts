import { ZodError, ZodSchema } from 'zod';
import { GrpcError } from '@app/nest/errors';
import { Logger, PipeTransform } from '@nestjs/common';

export class GrpcSchemaValidatorPipe implements PipeTransform {
	private readonly logger = new Logger(GrpcSchemaValidatorPipe.name);

	constructor(private schema: ZodSchema) {}

	transform(value: unknown, _metadata: any) {
		try {
			return this.schema.parse(value);
		} catch (error) {
			this.logger.error(error);
			if (error instanceof ZodError) {
				const formattedErrors = error.errors.map((err) => ({
					message: err.message,
					path: err.path.join('.'),
				}));
				throw new GrpcError(
					'API-00004',
					{
						message: `Validation failed`,
					},
					null,
					formattedErrors,
				);
			} else {
				throw new GrpcError('API-00004', {
					message: `Validation failed`,
				});
			}
		}
	}
}
