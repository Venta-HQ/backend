import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { RequestContextService } from '../../networking/request-context';
import { LokiTransportService } from './loki-transport.service';

const chalk = require('chalk');

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
		// Check if we're in development mode
		const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';

		if (isDevelopment) {
			// Pretty formatted logs for development
			this.logPretty(logData, trace);
		} else {
			// Structured JSON logs for production
			this.logStructured(logData, trace);
		}
	}

	private logPretty(logData: LogData, trace?: string): void {
		const timestamp = chalk.gray(new Date(logData.timestamp).toLocaleTimeString());
		const level = this.formatLevel(logData.level);
		const context = logData.context ? chalk.cyan(`[${logData.context}]`) : '';
		const requestId = logData.requestId ? chalk.gray(`(${logData.requestId.slice(0, 8)}...)`) : '';

		// Main message
		const message = this.formatMessage(logData.message, logData.level);

		// Format data if present
		const dataStr = logData.data ? this.formatData(logData.data) : '';

		// Check if we should put data inline or on new line
		const shouldUseNewLine = dataStr && (dataStr.length > 80 || dataStr.includes('\n'));

		if (shouldUseNewLine) {
			// Long or multi-line data goes on separate line
			const logLine = [timestamp, level, context, requestId, message].filter(Boolean).join(' ');
			console.log(logLine);
			console.log('  ' + dataStr); // Indented for visual hierarchy
		} else {
			// Short data stays inline
			const logLine = [timestamp, level, context, requestId, message, dataStr].filter(Boolean).join(' ');
			console.log(logLine);
		}

		// Add trace if present
		if (trace) {
			console.log('  ' + chalk.red('Stack Trace:'));
			// Handle case where trace might be an object instead of string
			const traceStr = typeof trace === 'string' ? trace : String(trace);
			// Wrap and indent each line of the stack trace
			const wrappedTrace = this.wrapStackTrace(traceStr);
			console.log(chalk.gray(wrappedTrace));
		}
	}

	private logStructured(logData: LogData, trace?: string): void {
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

	private formatData(data: Record<string, any>): string {
		try {
			// Handle case where data might be a string, array, or non-object
			if (typeof data !== 'object' || data === null) {
				return chalk.gray('│') + ' ' + chalk.white(String(data));
			}

			// Handle arrays
			if (Array.isArray(data)) {
				try {
					return chalk.gray('│') + ' ' + chalk.white(JSON.stringify(data));
				} catch {
					return chalk.gray('│') + ' ' + chalk.white('[array]');
				}
			}

			const formatted = Object.entries(data)
				.map(([key, value]) => {
					let formattedValue: string;
					if (value === null) {
						formattedValue = 'null';
					} else if (value === undefined) {
						formattedValue = 'undefined';
					} else if (value instanceof Error) {
						// Handle Error objects specially with line wrapping
						const errorMessage = `${value.name}: ${value.message}`;
						formattedValue = this.wrapText(errorMessage, 100, '  ');
					} else if (typeof value === 'object') {
						try {
							// For plain objects, check if they have meaningful content
							const stringified = JSON.stringify(value, null, 0);
							formattedValue = stringified === '{}' ? '[empty object]' : stringified;
						} catch {
							formattedValue = '[circular object]';
						}
					} else {
						formattedValue = String(value);
					}
					return `${chalk.gray(key)}=${chalk.white(formattedValue)}`;
				})
				.join(' ');
			return formatted ? chalk.gray('│') + ' ' + formatted : '';
		} catch {
			return chalk.gray('│ [data formatting error]');
		}
	}

	private wrapText(text: string, maxWidth: number, indent: string = ''): string {
		const words = text.split(' ');
		const lines: string[] = [];
		let currentLine = '';

		for (const word of words) {
			const testLine = currentLine ? `${currentLine} ${word}` : word;

			if (testLine.length <= maxWidth) {
				currentLine = testLine;
			} else {
				if (currentLine) {
					lines.push(currentLine);
					currentLine = word;
				} else {
					// Word is longer than maxWidth, just add it
					lines.push(word);
				}
			}
		}

		if (currentLine) {
			lines.push(currentLine);
		}

		return lines.map((line, index) => (index === 0 ? line : indent + line)).join('\n');
	}

	private wrapStackTrace(trace: string): string {
		const lines = trace.split('\n');
		const wrappedLines: string[] = [];

		for (const line of lines) {
			if (line.trim()) {
				// Wrap long lines but preserve stack trace formatting
				const wrapped = this.wrapText(line.trim(), 120, '    ');
				// Add base indentation for stack trace
				const indented = '    ' + wrapped;
				wrappedLines.push(indented);
			} else {
				wrappedLines.push('    '); // Preserve empty lines with indentation
			}
		}

		return wrappedLines.join('\n');
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
