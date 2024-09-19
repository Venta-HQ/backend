import { ZodError, ZodSchema } from 'zod';
import { status } from '@grpc/grpc-js';
import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class GrpcSchemaValidatorPipe implements PipeTransform {
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
				throw new RpcException({
					code: status.INVALID_ARGUMENT,
					details: { validationErrors: formattedErrors },
					message: `No ID provided`,
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
