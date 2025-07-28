import { ZodError, ZodSchema } from 'zod';
import { AppError, ErrorCodes } from '@app/nest/errors';
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
				const firstError = error.errors[0];
				const field = firstError.path.join('.');

				throw AppError.validation(ErrorCodes.VALIDATION_ERROR, {
					field,
					errors: formattedErrors,
				});
			} else {
				throw AppError.validation(ErrorCodes.VALIDATION_ERROR);
			}
		}
	}
}
