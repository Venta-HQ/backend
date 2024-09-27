import { PinoLogger } from 'nestjs-pino';
import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class GrpcLogger implements LoggerService {
	private requestId = 'no-request-id';
	constructor(private logger: PinoLogger) {}

	setRequestId(id: string) {
		this.requestId = id;
	}

	clearRequest() {
		this.requestId = 'no-request-id';
		// this.context = 'none';
	}

	log(message: string, context: string, optionalParams: { [K: string]: any }) {
		return this.logger.info(
			{
				...optionalParams,
				context,
				requestId: this.requestId,
			},
			message,
		);
	}

	error(message: string, context: string, optionalParams: { [K: string]: any }) {
		return this.logger.info(
			{
				...optionalParams,
				context,
				requestId: this.requestId,
			},
			message,
		);
	}

	/**
	 * Write a 'fatal' level log.
	 */
	fatal(message: string, context: string, optionalParams: { [K: string]: any }) {
		return this.logger.fatal(
			{
				...optionalParams,
				context,
				requestId: this.requestId,
			},
			message,
		);
	}

	/**
	 * Write a 'warn' level log.
	 */
	warn(message: string, context: string, optionalParams: { [K: string]: any }) {
		return this.logger.warn(
			{
				...optionalParams,
				context,
				requestId: this.requestId,
			},
			message,
		);
	}

	/**
	 * Write a 'debug' level log.
	 */
	debug?(message: string, context: string, optionalParams: { [K: string]: any }) {
		return this.logger.debug(
			{
				...optionalParams,
				context,
				requestId: this.requestId,
			},
			message,
		);
	}

	/**
	 * Write a 'verbose' level log.
	 */
	verbose?(message: string, context: string, optionalParams: { [K: string]: any }) {
		return this.logger.info(
			{
				...optionalParams,
				context,
				requestId: this.requestId,
			},
			message,
		);
	}
}
