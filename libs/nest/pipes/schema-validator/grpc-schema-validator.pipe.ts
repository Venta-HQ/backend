import { ZodError, ZodSchema } from 'zod';
import { status } from '@grpc/grpc-js';
import { ArgumentMetadata, Logger, PipeTransform } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class GrpcSchemaValidatorPipe implements PipeTransform {
	private readonly logger = new Logger(GrpcSchemaValidatorPipe.name);

	constructor(private schema: ZodSchema) {}

	transform(value: unknown, _metadata: ArgumentMetadata) {
		try {
			return this.schema.parse(value);
		} catch (error) {
			this.logger.error(error);
			console.log(error.errors, value);
			if (error instanceof ZodError) {
				const formattedErrors = error.errors.map((err) => ({
					message: err.message,
					path: err.path.join('.'),
				}));
				throw new RpcException({
					code: status.INVALID_ARGUMENT,
					details: { validationErrors: formattedErrors },
				});
			} else {
				throw new RpcException({
					code: status.INVALID_ARGUMENT,
					message: `Validation failed`,
				});
			}
		}
	}
}
