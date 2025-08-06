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

@Injectable()
export class LokiTransportService {
	private lokiUrl: string;
	private lokiUsername: string;
	private lokiPassword: string;
	private appName: string;
	private batch: LogEntry[] = [];
	private batchTimeout: NodeJS.Timeout | null = null;
	private readonly BATCH_SIZE = 10;
	private readonly BATCH_INTERVAL = 5000; // 5 seconds

	constructor(
		private readonly configService: ConfigService,
		@Inject('LOGGER_OPTIONS') private readonly options: { appName: string },
	) {
		this.lokiUrl = this.configService.get('LOKI_URL') || '';
		this.lokiUsername = this.configService.get('LOKI_USERNAME') || '';
		this.lokiPassword = this.configService.get('LOKI_PASSWORD') || '';
		this.appName = this.options.appName;
	}

	sendLog(entry: Omit<LogEntry, 'app'>) {
		if (!this.lokiUrl || !this.lokiUsername || !this.lokiPassword) {
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

	private async flushBatch() {
		if (this.batch.length === 0) return;

		const logs = this.batch;
		this.batch = [];

		if (this.batchTimeout) {
			clearTimeout(this.batchTimeout);
			this.batchTimeout = null;
		}

		try {
			// Group logs by their labels for better Loki organization
			const streams = new Map<string, any[]>();

			logs.forEach((log) => {
				// Create labels for Loki - these become queryable fields
				const labels = {
					app: log.app,
					level: log.level,
					...(log.context && { context: log.context }),
					...(log.requestId && { requestId: log.requestId }),
				};

				// Create a key for grouping logs with the same labels
				const labelKey = JSON.stringify(labels);

				if (!streams.has(labelKey)) {
					streams.set(labelKey, []);
				}

				streams.get(labelKey)!.push([Math.floor(Date.now() * 1000000).toString(), JSON.stringify(log)]);
			});

			const lokiPayload = {
				streams: Array.from(streams.entries()).map(([labelKey, values]) => ({
					stream: JSON.parse(labelKey),
					values,
				})),
			};

			const response = await fetch(`${this.lokiUrl}/loki/api/v1/push`, {
				body: JSON.stringify(lokiPayload),
				headers: {
					Authorization: `Basic ${Buffer.from(`${this.lokiUsername}:${this.lokiPassword}`).toString('base64')}`,
					'Content-Type': 'application/json',
				},
				method: 'POST',
			});

			if (!response.ok) {
				console.error(`Failed to send logs to Loki: ${response.status} ${response.statusText}`);
			}
		} catch (error) {
			console.error('Error sending logs to Loki:', error);
		}
	}
}
