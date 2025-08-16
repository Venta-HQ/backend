import { connect, NatsConnection, Subscription } from 'nats';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@venta/nest/modules';

export interface QueueMessage {
	data: any;
	subject: string;
	timestamp: string;
}

export interface QueueHandler {
	handler: (data: any) => Promise<void>;
	subject: string;
}

@Injectable()
export class NatsQueueService implements OnModuleInit, OnModuleDestroy {
	private nc: NatsConnection;
	private subscriptions: Subscription[] = [];

	constructor(
		private readonly configService: ConfigService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(NatsQueueService.name);
	}

	async onModuleInit() {
		const natsUrl = this.configService.get('NATS_URL') || 'nats://localhost:4222';

		try {
			this.nc = await connect({ servers: natsUrl });
			this.logger.log(`Connected to NATS server: ${natsUrl}`);
		} catch (error) {
			this.logger.error('Failed to connect to NATS server:', error.stack, { error, natsUrl });
			throw error;
		}
	}

	async onModuleDestroy() {
		// Unsubscribe from all subscriptions
		for (const subscription of this.subscriptions) {
			subscription.unsubscribe();
		}

		// Close NATS connection
		if (this.nc) {
			await this.nc.close();
			this.logger.log('NATS connection closed');
		}
	}

	/**
	 * Subscribe to a subject with queue group for load balancing
	 */
	subscribeToQueue(subject: string, queueGroup: string, handler: (data: any) => Promise<void>): void {
		const subscription = this.nc.subscribe(subject, {
			queue: queueGroup,
		});

		// Use the correct API for handling messages
		(async () => {
			for await (const msg of subscription) {
				try {
					const data = JSON.parse(msg.data.toString());
					this.logger.log(`Processing message from queue ${queueGroup}: ${subject}`);

					await handler(data);

					// In NATS v2, we don't need explicit ack/nak for regular subscriptions
					// Messages are automatically acknowledged
					this.logger.log(`Successfully processed message: ${subject}`);
				} catch (error) {
					this.logger.error(`Error processing message ${subject}:`, error.stack, { error, subject, queueGroup });
					// In regular subscriptions, we can't NAK - just log the error
				}
			}
		})();

		this.subscriptions.push(subscription);
		this.logger.log(`Subscribed to ${subject} with queue group: ${queueGroup}`);
	}

	/**
	 * Subscribe to multiple subjects with the same queue group
	 */
	subscribeToMultipleQueues(handlers: QueueHandler[], queueGroup: string): void {
		for (const { handler, subject } of handlers) {
			this.subscribeToQueue(subject, queueGroup, handler);
		}
	}

	/**
	 * Publish message to a subject
	 */
	async publish(subject: string, data: any): Promise<void> {
		try {
			const message = JSON.stringify({
				...data,
				timestamp: new Date().toISOString(),
			});

			await this.nc.publish(subject, message);
			this.logger.log(`Published message to ${subject}`);
		} catch (error) {
			this.logger.error(`Failed to publish message to ${subject}:`, error.stack, { error, subject });
			throw error;
		}
	}

	/**
	 * Get connection status
	 */
	isConnected(): boolean {
		return !!(this.nc && !this.nc.closed());
	}
}
