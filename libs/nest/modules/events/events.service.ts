import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';

interface EventMessage {
	data: any;
	messageId?: string;
	timestamp: string;
	type: string;
}

@Injectable()
export class EventsService {
	private readonly logger = new Logger(EventsService.name);
	private readonly failedEventsKey = 'failed_events';
	private readonly maxRetries = 3;

	constructor(@InjectRedis() private readonly redis: Redis) {}

	async publishEvent<T>(eventType: string, data: T): Promise<void> {
		try {
			const event: EventMessage = {
				data,
				messageId: this.generateMessageId(),
				timestamp: new Date().toISOString(),
				type: eventType,
			};

			await this.redis.publish('events', JSON.stringify(event));
			this.logger.log(`Published event: ${eventType} (ID: ${event.messageId})`);
		} catch (error) {
			this.logger.error(`Failed to publish event ${eventType}:`, error);
			// Store failed events for later processing
			await this.storeFailedEvent(eventType, data, error);
			throw error;
		}
	}

	async subscribeToEvents(callback: (event: EventMessage) => void): Promise<void> {
		const subscriber = this.redis.duplicate();

		await subscriber.subscribe('events');

		subscriber.on('message', async (channel, message) => {
			try {
				const event: EventMessage = JSON.parse(message);
				await callback(event);
				this.logger.debug(`Processed event: ${event.type} (ID: ${event.messageId})`);
			} catch (error) {
				this.logger.error('Failed to process event:', error);
				// Could implement dead letter queue here
			}
		});

		subscriber.on('error', (error) => {
			this.logger.error('Redis subscriber error:', error);
		});

		// Process any failed events on startup
		await this.processFailedEvents(callback);
	}

	private async storeFailedEvent(eventType: string, data: any, error: any): Promise<void> {
		try {
			const failedEvent = {
				data,
				error: error.message,
				retryCount: 0,
				timestamp: new Date().toISOString(),
				type: eventType,
			};
			await this.redis.lpush(this.failedEventsKey, JSON.stringify(failedEvent));
			this.logger.warn(`Stored failed event: ${eventType}`);
		} catch (storeError) {
			this.logger.error('Failed to store failed event:', storeError);
		}
	}

	private async processFailedEvents(callback: (event: EventMessage) => void): Promise<void> {
		try {
			const failedEvents = await this.redis.lrange(this.failedEventsKey, 0, -1);
			if (failedEvents.length > 0) {
				this.logger.log(`Processing ${failedEvents.length} failed events`);

				for (const failedEventStr of failedEvents) {
					try {
						const failedEvent = JSON.parse(failedEventStr);
						if (failedEvent.retryCount < this.maxRetries) {
							await callback({
								data: failedEvent.data,
								timestamp: failedEvent.timestamp,
								type: failedEvent.type,
							});
							// Remove from failed events list
							await this.redis.lrem(this.failedEventsKey, 1, failedEventStr);
						} else {
							this.logger.error(`Event ${failedEvent.type} exceeded max retries`);
						}
					} catch (error) {
						this.logger.error('Failed to reprocess failed event:', error);
					}
				}
			}
		} catch (error) {
			this.logger.error('Failed to process failed events:', error);
		}
	}

	private generateMessageId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// Utility method to get failed events count
	async getFailedEventsCount(): Promise<number> {
		return await this.redis.llen(this.failedEventsKey);
	}
}
