import * as chalk from 'chalk';
import * as PrettyErrorLib from 'pretty-error';
import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
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
	private prettyError?: any;
	private readonly isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';

	constructor(
		private readonly requestContextService?: RequestContextService,
		private readonly lokiTransport?: LokiTransportService,
	) {
		// Initialize Pretty-Error with custom styling (only in development)
		if (this.isDevelopment) {
			try {
				const PrettyErrorCtor: any = (PrettyErrorLib as any)?.default || (PrettyErrorLib as any);
				this.prettyError = new PrettyErrorCtor();
				this.setupPrettyError();
			} catch (error) {
				console.warn('Failed to initialize Pretty-Error:', (error as any).message);
			}
		}
	}

	private setupPrettyError(): void {
		if (!this.prettyError) return;

		// Configure Pretty-Error for better readability
		this.prettyError.skipNodeFiles(); // Hide node_modules from stack traces
		this.prettyError.skipPackage('core-js'); // Skip polyfill noise

		// Custom styling that matches our logger theme
		this.prettyError.appendStyle({
			'pretty-error > header > title > kind': {
				background: 'none',
				color: 'red',
			},
			'pretty-error > header > message': {
				color: 'bright-white',
				background: 'none',
			},
			'pretty-error > trace > item': {
				marginBottom: 0,
				bullet: '"    "', // Match our indentation
			},
			'pretty-error > trace > item > header > pointer > file': {
				color: 'cyan',
			},
			'pretty-error > trace > item > header > pointer > line': {
				color: 'yellow',
			},
			'pretty-error > trace > item > header > what': {
				color: 'white',
			},
			'pretty-error > trace > item > source': {
				color: 'grey',
			},
		});
	}

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

		// Don't auto-generate request IDs - let the request handling infrastructure set them
		return undefined;
	}

	private createLogData(
		message: string,
		level: 'log' | 'error' | 'warn' | 'debug' | 'verbose',
		data?: Record<string, any>,
		context?: string,
	): LogData {
		const activeTraceId = trace.getActiveSpan()?.spanContext().traceId;
		return {
			context: context || this.context,
			data,
			level,
			message,
			requestId: this.getRequestId() || activeTraceId,
			timestamp: new Date().toISOString(),
		};
	}

	private logToConsole(logData: LogData, traceStr?: string): void {
		// Check if we're in development mode
		const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';

		if (isDevelopment) {
			// Pretty formatted logs for development
			this.logPretty(logData, traceStr);
		} else {
			// Structured JSON logs for production
			this.logStructured(logData, traceStr);
		}
	}

	private logPretty(logData: LogData, traceStr?: string): void {
		// Use Pretty-Error for everything if available, otherwise simple formatting
		if (traceStr && this.prettyError) {
			try {
				// Create a rich error object for Pretty-Error
				const error = new Error(logData.message);
				error.stack = traceStr;

				// Add context information as error properties
				if (logData.context) {
					(error as any).context = logData.context;
				}
				if (logData.data) {
					Object.assign(error, logData.data);
				}

				// Render with Pretty-Error
				console.log(this.prettyError.render(error));
				return;
			} catch (prettError) {
				console.warn('Pretty-Error rendering failed:', (prettError as any).message);
			}
		}

		// Fallback to simple clean formatting
		const timestamp = chalk.gray(new Date(logData.timestamp).toLocaleTimeString());
		const level = this.formatLevel(logData.level);
		const context = logData.context ? chalk.cyan(`[${logData.context}]`) : '';
		const message = this.formatMessage(logData.message, logData.level);

		// Simple one-line format
		const logLine = [timestamp, level, context, message].filter(Boolean).join(' ');
		console.log(logLine);

		// Add data if present
		if (logData.data) {
			console.log(chalk.gray('  Data:'), JSON.stringify(logData.data, null, 2));
		}

		// Add trace if present (simple format)
		if (traceStr) {
			console.log(chalk.red('  Stack Trace:'));
			console.log(chalk.gray(traceStr));
		}
	}

	private logStructured(logData: LogData, traceStr?: string): void {
		const { requestId, ...consoleData } = logData;
		const structuredMessage = JSON.stringify({
			...consoleData,
			...(requestId && { requestId }),
		});

		switch (logData.level) {
			case 'error':
				console.error(traceStr ? `${structuredMessage}\nTrace: ${traceStr}` : structuredMessage);
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

	private formatLevel(level: string): string {
		switch (level) {
			case 'error':
				return chalk.red('ERROR');
			case 'warn':
				return chalk.yellow('WARN ');
			case 'debug':
				return chalk.blue('DEBUG');
			case 'verbose':
				return chalk.magenta('VERB ');
			default:
				return chalk.green('INFO ');
		}
	}

	private formatMessage(message: string, level: string): string {
		switch (level) {
			case 'error':
				return chalk.red(message);
			case 'warn':
				return chalk.yellow(message);
			case 'debug':
				return chalk.blue(message);
			default:
				return chalk.white(message);
		}
	}

	log(message: string, data?: Record<string, any>, context?: string): void {
		const logData = this.createLogData(message, 'log', data, context);
		this.logToConsole(logData);
		this.lokiTransport?.sendLog(logData);
	}

	error(message: string, traceStr?: string, data?: Record<string, any>, context?: string): void {
		const logData = this.createLogData(message, 'error', data, context);
		this.logToConsole(logData, traceStr);
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
