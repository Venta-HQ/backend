import { randomUUID } from 'crypto';
import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { RequestContextService } from '../request-context';
import { LokiTransportService } from './loki-transport.service';

interface LogData {
	context?: string;
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
		// First try to get from RequestContextService (for gRPC and NATS)
		const existingRequestId = this.requestContextService?.getRequestId();
		if (existingRequestId) {
			return existingRequestId;
		}

		// Check for correlation ID (for NATS messages)
		const correlationId = this.requestContextService?.getCorrelationId();
		if (correlationId) {
			return correlationId;
		}

		// For HTTP requests, only generate if we have a RequestContextService
		// This prevents unnecessary UUID generation when no context is available
		if (this.requestContextService) {
			const newRequestId = randomUUID();
			this.requestContextService.setRequestId(newRequestId);
			return newRequestId;
		}

		return undefined;
	}

	private createLogData(
		message: string,
		level: 'log' | 'error' | 'warn' | 'debug' | 'verbose',
		context?: string,
	): LogData {
		return {
			context: context || this.context,
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

	log(message: string, context?: string): void {
		const logData = this.createLogData(message, 'log', context);
		this.logToConsole(logData);
		this.lokiTransport?.sendLog(logData);
	}

	error(message: string, trace?: string, context?: string): void {
		const logData = this.createLogData(message, 'error', context);
		this.logToConsole(logData, trace);
		this.lokiTransport?.sendLog(logData);
	}

	warn(message: string, context?: string): void {
		const logData = this.createLogData(message, 'warn', context);
		this.logToConsole(logData);
		this.lokiTransport?.sendLog(logData);
	}

	debug(message: string, context?: string): void {
		const logData = this.createLogData(message, 'debug', context);
		this.logToConsole(logData);
		this.lokiTransport?.sendLog(logData);
	}

	verbose(message: string, context?: string): void {
		const logData = this.createLogData(message, 'verbose', context);
		this.logToConsole(logData);
		this.lokiTransport?.sendLog(logData);
	}
}
