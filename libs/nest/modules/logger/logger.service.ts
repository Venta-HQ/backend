import { randomUUID } from 'crypto';
import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { RequestContextService } from '../request-context';
import { LokiTransportService } from './loki-transport.service';

@Injectable({ scope: Scope.TRANSIENT })
export class Logger implements LoggerService {
	private context?: string;

	constructor(
		private readonly requestContextService?: RequestContextService,
		private readonly lokiTransport?: LokiTransportService,
	) {}

	setContext(context: string) {
		this.context = context;
		return this;
	}

	// Generate or retrieve request ID or correlation ID
	private getRequestId(): string | undefined {
		// First try to get from RequestContextService (for gRPC and NATS)
		const existingRequestId = this.requestContextService?.get('requestId');
		if (existingRequestId) {
			return existingRequestId;
		}

		// Check for correlation ID (for NATS messages)
		const correlationId = this.requestContextService?.get('correlationId');
		if (correlationId) {
			return correlationId;
		}

		// For HTTP requests, generate a new one if none exists
		const newRequestId = randomUUID();
		this.requestContextService?.set('requestId', newRequestId);
		return newRequestId;
	}

	private getStructuredMessage(
		message: string,
		context?: string,
		level: 'log' | 'error' | 'warn' | 'debug' | 'verbose' = 'log',
	) {
		const requestId = this.getRequestId();
		const structuredData = {
			context: context || this.context,
			level,
			message,
			...(requestId && { requestId }),
			timestamp: new Date().toISOString(),
		};
		return JSON.stringify(structuredData);
	}

	log(message: string, context?: string) {
		const structuredMessage = this.getStructuredMessage(message, context, 'log');
		console.log(structuredMessage);
		this.lokiTransport?.sendLog({
			context: context || this.context,
			level: 'log',
			message,
			requestId: this.getRequestId(),
			timestamp: new Date().toISOString(),
		});
	}

	error(message: string, trace?: string, context?: string) {
		const structuredMessage = this.getStructuredMessage(message, context, 'error');
		if (trace) {
			console.error(`${structuredMessage}\nTrace: ${trace}`);
		} else {
			console.error(structuredMessage);
		}
		this.lokiTransport?.sendLog({
			context: context || this.context,
			level: 'error',
			message,
			requestId: this.getRequestId(),
			timestamp: new Date().toISOString(),
		});
	}

	warn(message: string, context?: string) {
		const structuredMessage = this.getStructuredMessage(message, context, 'warn');
		console.warn(structuredMessage);
		this.lokiTransport?.sendLog({
			context: context || this.context,
			level: 'warn',
			message,
			requestId: this.getRequestId(),
			timestamp: new Date().toISOString(),
		});
	}

	debug(message: string, context?: string) {
		const structuredMessage = this.getStructuredMessage(message, context, 'debug');
		console.debug(structuredMessage);
		this.lokiTransport?.sendLog({
			context: context || this.context,
			level: 'debug',
			message,
			requestId: this.getRequestId(),
			timestamp: new Date().toISOString(),
		});
	}

	verbose(message: string, context?: string) {
		const structuredMessage = this.getStructuredMessage(message, context, 'verbose');
		console.log(structuredMessage);
		this.lokiTransport?.sendLog({
			context: context || this.context,
			level: 'verbose',
			message,
			requestId: this.getRequestId(),
			timestamp: new Date().toISOString(),
		});
	}
}
