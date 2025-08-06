import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface LogEntry {
	app: string;
	context?: string;
	level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';
	message: string;
	requestId?: string;
	timestamp: string;
}

interface LokiStream {
	stream: Record<string, string>;
	values: [string, string][];
}

interface LokiPayload {
	streams: LokiStream[];
}

@Injectable()
export class LokiTransportService {
	private readonly lokiUrl: string;
	private readonly lokiUsername: string;
	private readonly lokiPassword: string;
	private readonly appName: string;
	private readonly batch: LogEntry[] = [];
	private batchTimeout: NodeJS.Timeout | null = null;
	private readonly BATCH_SIZE = 10;
	private readonly BATCH_INTERVAL = 5000; // 5 seconds

	constructor(
		private readonly configService: ConfigService,
		@Inject('LOGGER_OPTIONS') private readonly options: { appName: string },
	) {
		try {
			this.lokiUrl = this.configService?.get('LOKI_URL') || '';
			this.lokiUsername = this.configService?.get('LOKI_USERNAME') || '';
			this.lokiPassword = this.configService?.get('LOKI_PASSWORD') || '';
		} catch (error) {
			// Handle case where ConfigService is not available (e.g., during testing)
			this.lokiUrl = '';
			this.lokiUsername = '';
			this.lokiPassword = '';
		}
		this.appName = this.options.appName;
	}

	sendLog(entry: Omit<LogEntry, 'app'>): void {
		if (!this.isConfigured()) {
			return; // Skip if Loki is not configured
		}

		const logEntry: LogEntry = {
			...entry,
			app: this.appName,
		};

		this.batch.push(logEntry);

		if (this.batch.length >= this.BATCH_SIZE) {
			this.flushBatch();
		} else if (!this.batchTimeout) {
			this.batchTimeout = setTimeout(() => this.flushBatch(), this.BATCH_INTERVAL);
		}
	}

	private isConfigured(): boolean {
		return !!(this.lokiUrl && this.lokiUsername && this.lokiPassword);
	}

	private async flushBatch(): Promise<void> {
		if (this.batch.length === 0) return;

		const logs = this.batch;
		this.batch.length = 0; // Clear array more efficiently

		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
			this.batchTimeout = null;
		}

		try {
			const lokiPayload = this.createLokiPayload(logs);
			await this.sendToLoki(lokiPayload);
		} catch (error) {
			console.error('Error sending logs to Loki:', error);
		}
	}

	private createLokiPayload(logs: LogEntry[]): LokiPayload {
		// Group logs by their labels for better Loki organization
		const streams = new Map<string, [string, string][]>();

		logs.forEach((log) => {
			// Create labels for Loki - these become queryable fields
			const labels: Record<string, string> = {
				app: log.app,
				level: log.level,
			};

			if (log.context) {
				labels.context = log.context;
			}

			if (log.requestId) {
				labels.requestId = log.requestId;
			}

			// Create a key for grouping logs with the same labels
			const labelKey = JSON.stringify(labels);

			if (!streams.has(labelKey)) {
				streams.set(labelKey, []);
			}

			const timestamp = Math.floor(Date.now() * 1000000).toString();
			streams.get(labelKey)!.push([timestamp, JSON.stringify(log)]);
		});

		return {
			streams: Array.from(streams.entries()).map(([labelKey, values]) => ({
				stream: JSON.parse(labelKey),
				values,
			})),
		};
	}

	private async sendToLoki(payload: LokiPayload): Promise<void> {
		const response = await fetch(`${this.lokiUrl}/loki/api/v1/push`, {
			body: JSON.stringify(payload),
			headers: {
				Authorization: `Basic ${Buffer.from(`${this.lokiUsername}:${this.lokiPassword}`).toString('base64')}`,
				'Content-Type': 'application/json',
			},
			method: 'POST',
		});

		if (!response.ok) {
			console.error(`Failed to send logs to Loki: ${response.status} ${response.statusText}`);
		}
	}
}
