import { randomUUID } from 'crypto';
import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { RequestContextService } from '../../networking/request-context';
import { LokiTransportService } from './loki-transport.service';

interface LogData {
	context?: string;
	data?: Record<string, any>;
	level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';
	message: string;
	requestId?: string;
	timestamp: string;
}

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
		// Only try to get request context if the service is available
		if (!this.requestContextService) {
			return undefined;
		}

		// First try to get existing request ID (for gRPC and NATS)
		const existingRequestId = this.requestContextService.getRequestId();
		if (existingRequestId) {
			return existingRequestId;
		}

		// Check for correlation ID (for NATS messages)
		const correlationId = this.requestContextService.getCorrelationId();
		if (correlationId) {
			return correlationId;
		}

		// Only generate a new request ID if we don't already have one
		// This should only happen during actual request processing, not startup
		// Don't auto-generate request IDs - let the request handling infrastructure set them
		return undefined;
	}

	private createLogData(
		message: string,
		level: 'log' | 'error' | 'warn' | 'debug' | 'verbose',
		data?: Record<string, any>,
		context?: string,
	): LogData {
		return {
			context: context || this.context,
			data,
			level,
			message,
			requestId: this.getRequestId(),
			timestamp: new Date().toISOString(),
		};
	}

	private logToConsole(logData: LogData, trace?: string): void {
		const { requestId, ...consoleData } = logData;
		const structuredMessage = JSON.stringify({
			...consoleData,
			...(requestId && { requestId }),
		});

		switch (logData.level) {
			case 'error':
				console.error(trace ? `${structuredMessage}\nTrace: ${trace}` : structuredMessage);
				break;
			case 'warn':
				console.warn(structuredMessage);
				break;
			case 'debug':
				console.debug(structuredMessage);
				break;
			default:
				console.log(structuredMessage);
		}
	}

	log(message: string, data?: Record<string, any>, context?: string): void {
		const logData = this.createLogData(message, 'log', data, context);
		this.logToConsole(logData);
		this.lokiTransport?.sendLog(logData);
	}

	error(message: string, trace?: string, data?: Record<string, any>, context?: string): void {
		const logData = this.createLogData(message, 'error', data, context);
		this.logToConsole(logData, trace);
		this.lokiTransport?.sendLog(logData);
	}

	warn(message: string, data?: Record<string, any>, context?: string): void {
		const logData = this.createLogData(message, 'warn', data, context);
		this.logToConsole(logData);
		this.lokiTransport?.sendLog(logData);
	}

	debug(message: string, data?: Record<string, any>, context?: string): void {
		const logData = this.createLogData(message, 'debug', data, context);
		this.logToConsole(logData);
		this.lokiTransport?.sendLog(logData);
	}

	verbose(message: string, data?: Record<string, any>, context?: string): void {
		const logData = this.createLogData(message, 'verbose', data, context);
		this.logToConsole(logData);
		this.lokiTransport?.sendLog(logData);
	}
}
