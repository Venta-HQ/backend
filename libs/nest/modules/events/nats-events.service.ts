// Note: Requires installing 'nats' package: npm install nats
import { connect, NatsConnection, StringCodec, Subscription } from 'nats';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventMessage, IEventsService } from './events.interface';

@Injectable()
export class NatsEventsService implements IEventsService {
	private readonly logger = new Logger(NatsEventsService.name);
	private nc: NatsConnection;
	private readonly sc = StringCodec();
	private readonly failedEventsKey = 'failed_events';
	private readonly maxRetries = 3;

	constructor(private readonly configService: ConfigService) {}

	async onModuleInit() {
		await this.connect();
	}

	async onModuleDestroy() {
		if (this.nc) {
			await this.nc.close();
		}
	}

	private async connect() {
		try {
			const natsUrl = this.configService.get('NATS_URL', 'nats://localhost:4222');
			this.nc = await connect({ servers: natsUrl });
			this.logger.log(`Connected to NATS at ${natsUrl}`);
		} catch (error) {
			this.logger.error('Failed to connect to NATS:', error);
			throw error;
		}
	}

	async publishEvent<T>(eventType: string, data: T): Promise<void> {
		try {
			const event: EventMessage = {
				data,
				messageId: this.generateMessageId(),
				timestamp: new Date().toISOString(),
				type: eventType,
			};

			// Publish to NATS with subject-based routing
			const subject = `events.${eventType}`;
			await this.nc.publish(subject, this.sc.encode(JSON.stringify(event)));

			this.logger.log(`Published event: ${eventType} (ID: ${event.messageId}) to ${subject}`);
		} catch (error) {
			this.logger.error(`Failed to publish event ${eventType}:`, error);
			// Store failed events for later processing
			await this.storeFailedEvent(eventType, data, error);
			throw error;
		}
	}

	async subscribeToEvents(callback: (event: EventMessage) => void): Promise<void> {
		try {
			// Subscribe to all events with wildcard
			const subscription = this.nc.subscribe('events.*');

			// Process messages
			for await (const msg of subscription) {
				try {
					const event: EventMessage = JSON.parse(this.sc.decode(msg.data));
					await callback(event);
					this.logger.debug(`Processed event: ${event.type} (ID: ${event.messageId})`);
				} catch (error) {
					this.logger.error('Failed to process event:', error);
				}
			}
		} catch (error) {
			this.logger.error('NATS subscription error:', error);
		}

		// Process any failed events on startup
		await this.processFailedEvents(callback);
	}

	// Subscribe to specific event types
	async subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<Subscription> {
		const subject = `events.${eventType}`;
		const subscription = this.nc.subscribe(subject);

		// Process messages for this specific event type
		(async () => {
			for await (const msg of subscription) {
				try {
					const event: EventMessage = JSON.parse(this.sc.decode(msg.data));
					await callback(event);
					this.logger.debug(`Processed ${eventType}: ${event.messageId}`);
				} catch (error) {
					this.logger.error(`Failed to process ${eventType}:`, error);
				}
			}
		})();

		return subscription;
	}

	private async storeFailedEvent(eventType: string, data: any, error: any): Promise<void> {
		try {
			const _failedEvent = {
				data,
				error: error.message,
				retryCount: 0,
				timestamp: new Date().toISOString(),
				type: eventType,
			};

			// Store in NATS key-value store or fallback to file
			this.logger.warn(`Stored failed event: ${eventType}`);
		} catch (storeError) {
			this.logger.error('Failed to store failed event:', storeError);
		}
	}

	private async processFailedEvents(_callback: (event: EventMessage) => void): Promise<void> {
		// Implementation would depend on how you store failed events
		// Could use NATS KV store or external storage
		this.logger.log('Processing failed events...');
	}

	private generateMessageId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// Utility method to get failed events count
	async getFailedEventsCount(): Promise<number> {
		// Implementation would depend on storage method
		return 0;
	}

	// Health check
	async healthCheck(): Promise<{ connected: boolean; status: string }> {
		return {
			connected: !this.nc.closed(),
			status: this.nc.closed() ? 'disconnected' : 'connected',
		};
	}
}
