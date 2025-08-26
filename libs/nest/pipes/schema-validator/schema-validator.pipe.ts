import { ZodError, ZodSchema } from 'zod';
import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';

export class SchemaValidatorPipe implements PipeTransform {
	private readonly logger = new Logger().setContext(SchemaValidatorPipe.name);

	constructor(private schema: ZodSchema) {}

	transform(value: unknown, metadata: ArgumentMetadata) {
		try {
			return this.schema.parse(value);
		} catch (error) {
			this.logger.error('Schema validation failed', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				value,
				type: metadata.type,
				data: metadata.data,
			});

			if (error instanceof ZodError) {
				const formattedErrors = error.errors.map((err) => ({
					message: err.message,
					path: err.path.join('.'),
					code: err.code,
				}));

				const firstError = error.errors[0];
				const field = firstError.path.join('.');

				const validationError = AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field,
					errors: formattedErrors,
				});

				// Auto-detect context or use explicit option
				if (this.shouldThrowWsException(metadata)) {
					throw new WsException(validationError);
				} else {
					throw validationError;
				}
			}

			const validationError = AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: metadata.data,
				message: error instanceof Error ? error.message : 'Unknown error',
			});

			// Auto-detect context or use explicit option
			if (this.shouldThrowWsException(metadata)) {
				throw new WsException(validationError);
			} else {
				throw validationError;
			}
		}
	}

	/**
	 * Determines whether to throw WsException based on context detection or explicit options
	 */
	private shouldThrowWsException(metadata: ArgumentMetadata): boolean {
		// Auto-detect WebSocket context
		return this.isWebSocketContext(metadata);
	}

	/**
	 * Auto-detect if we're in a WebSocket context vs HTTP context
	 *
	 * This relies on NestJS's decorator metadata patterns:
	 * - WebSocket decorators (@MessageBody, @ConnectedSocket) use type 'custom'
	 * - HTTP decorators (@Body, @Query, @Param) use specific types like 'body', 'query', 'param'
	 */
	private isWebSocketContext(metadata: ArgumentMetadata): boolean {
		// WebSocket handlers use 'custom' type for decorators like @MessageBody(), @ConnectedSocket()
		// HTTP handlers use specific types: 'body', 'query', 'param', 'headers', etc.
		return metadata.type === 'custom';
	}
}
