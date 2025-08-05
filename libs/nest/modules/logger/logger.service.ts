import { PinoLogger } from 'nestjs-pino';
import { Injectable, LoggerService } from '@nestjs/common';
import { RequestContextService } from '../request-context';

@Injectable()
export class Logger implements LoggerService {
	constructor(
		private logger: PinoLogger,
		private readonly requestContextService: RequestContextService,
	) {}

	private getRequestId(): string | undefined {
		// For gRPC: get from RequestContextService
		const grpcRequestId = this.requestContextService.get('requestId');
		if (grpcRequestId) {
			return grpcRequestId;
		}

		// For HTTP: Pino automatically handles request IDs via pinoHttp configuration
		// The request ID is already included in the log context by Pino
		return undefined;
	}

	log(message: string, context: string, optionalParams: { [K: string]: any }) {
		const requestId = this.getRequestId();
		return this.logger.info(
			{
				...optionalParams,
				context,
				...(requestId && { requestId }),
			},
			message,
		);
	}

	error(message: string, context: string, optionalParams: { [K: string]: any }) {
		const requestId = this.getRequestId();
		return this.logger.error(
			{
				...optionalParams,
				context,
				...(requestId && { requestId }),
			},
			message,
		);
	}

	/**
	 * Write a 'fatal' level log.
	 */
	fatal(message: string, context: string, optionalParams: { [K: string]: any }) {
		const requestId = this.getRequestId();
		return this.logger.fatal(
			{
				...optionalParams,
				context,
				...(requestId && { requestId }),
			},
			message,
		);
	}

	/**
	 * Write a 'warn' level log.
	 */
	warn(message: string, context: string, optionalParams: { [K: string]: any }) {
		const requestId = this.getRequestId();
		return this.logger.warn(
			{
				...optionalParams,
				context,
				...(requestId && { requestId }),
			},
			message,
		);
	}

	/**
	 * Write a 'debug' level log.
	 */
	debug?(message: string, context: string, optionalParams: { [K: string]: any }) {
		const requestId = this.getRequestId();
		return this.logger.debug(
			{
				...optionalParams,
				context,
				...(requestId && { requestId }),
			},
			message,
		);
	}

	/**
	 * Write a 'verbose' level log.
	 */
	verbose?(message: string, context: string, optionalParams: { [K: string]: any }) {
		const requestId = this.getRequestId();
		return this.logger.info(
			{
				...optionalParams,
				context,
				...(requestId && { requestId }),
			},
			message,
		);
	}
}
