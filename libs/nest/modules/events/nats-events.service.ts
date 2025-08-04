import { connect, NatsConnection, StringCodec, Subscription } from 'nats';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventMessage, EventStream, IEventsService, StreamSubscriptionOptions } from './events.interface';

@Injectable()
export class NatsEventsService implements IEventsService {
	private readonly logger = new Logger(NatsEventsService.name);
	private nc!: NatsConnection;
	private readonly sc = StringCodec();
	private activeStreams: Map<string, EventStream> = new Map();

	constructor(private readonly configService: ConfigService) {}

	async onModuleInit() {
		await this.connect();
	}

	async onModuleDestroy() {
		// Clean up all active streams
		for (const stream of Array.from(this.activeStreams.values())) {
			await this.unsubscribeFromStream(stream);
		}

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

	async publishEvent<T>(eventType: string, data: T, options?: Partial<EventMessage>): Promise<void> {
		try {
			const event: EventMessage = {
				data,
				messageId: this.generateMessageId(),
				timestamp: new Date().toISOString(),
				type: eventType,
				...options,
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
			const subscription = this.nc.subscribe('events.*');
			this.logger.log('Subscribed to all events');

			// Process messages
			for await (const msg of subscription) {
				try {
					const eventData = JSON.parse(this.sc.decode(msg.data));
					await callback(eventData);
				} catch (error) {
					this.logger.error('Error processing event:', error);
				}
			}
		} catch (error) {
			this.logger.error('Failed to subscribe to events:', error);
			throw error;
		}
	}

	async subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<Subscription> {
		try {
			const subscription = this.nc.subscribe(`events.${eventType}`);
			this.logger.log(`Subscribed to event type: ${eventType}`);

			// Process messages
			(async () => {
				for await (const msg of subscription) {
					try {
						const eventData = JSON.parse(this.sc.decode(msg.data));
						await callback(eventData);
					} catch (error) {
						this.logger.error(`Error processing ${eventType} event:`, error);
					}
				}
			})();

			return subscription;
		} catch (error) {
			this.logger.error(`Failed to subscribe to event type ${eventType}:`, error);
			throw error;
		}
	}

	async subscribeToStream(
		options: StreamSubscriptionOptions,
		callback: (event: EventMessage) => void,
	): Promise<EventStream> {
		try {
			const streamName = options.streamName || 'default-stream';
			const eventTypes = options.eventTypes || ['*'];
			const groupName = options.groupName || 'default-group';

			// Create subscription with queue group for load balancing
			const subscription = this.nc.subscribe(`events.${eventTypes.join('.')}`, {
				queue: groupName,
			});

			const stream: EventStream = {
				eventTypes,
				streamName,
				subscription,
			};

			this.activeStreams.set(streamName, stream);
			this.logger.log(`Created stream: ${streamName} with event types: ${eventTypes.join(', ')}`);

			// Process messages
			(async () => {
				for await (const msg of subscription) {
					try {
						const eventData = JSON.parse(this.sc.decode(msg.data));
						await callback(eventData);
					} catch (error) {
						this.logger.error(`Error processing event in stream ${streamName}:`, error);
					}
				}
			})();

			return stream;
		} catch (error) {
			this.logger.error(`Failed to create stream:`, error);
			throw error;
		}
	}

	async unsubscribeFromStream(stream: EventStream): Promise<void> {
		try {
			stream.subscription.unsubscribe();
			this.activeStreams.delete(stream.streamName);
			this.logger.log(`Unsubscribed from stream: ${stream.streamName}`);
		} catch (error) {
			this.logger.error(`Failed to unsubscribe from stream ${stream.streamName}:`, error);
			throw error;
		}
	}

	getActiveStreams(): EventStream[] {
		return Array.from(this.activeStreams.values());
	}

	private async storeFailedEvent(eventType: string, data: any, error: any): Promise<void> {
		// In a production environment, you might want to store failed events
		// in a persistent storage for later processing
		this.logger.error(`Storing failed event ${eventType}:`, { data, error });
	}

	private generateMessageId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	async healthCheck(): Promise<{ connected: boolean; status: string }> {
		try {
			const connected = !this.nc.closed();
			return {
				connected,
				status: connected ? 'connected' : 'disconnected',
			};
		} catch (error) {
			return {
				connected: false,
				status: 'error',
			};
		}
	}
}
