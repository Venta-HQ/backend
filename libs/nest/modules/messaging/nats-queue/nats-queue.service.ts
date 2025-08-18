import { connect, NatsConnection, Subscription } from 'nats';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { context as otContext, propagation, trace } from '@opentelemetry/api';
import { Logger } from '@venta/nest/modules';
import { RequestContextService } from '../../networking/request-context';

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
		private readonly requestContextService: RequestContextService,
	) {
		this.logger.setContext(NatsQueueService.name);
	}

	async onModuleInit() {
		const natsUrl = this.configService.get('NATS_URL') || 'nats://localhost:4222';

		try {
			this.nc = await connect({ servers: natsUrl });
			this.logger.debug(`Connected to NATS server: ${natsUrl}`);
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
			this.logger.debug('NATS connection closed');
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
					// Extract distributed context from NATS headers
					const carrier: Record<string, string> = {};
					const hdrs = msg.headers;
					if (hdrs) {
						for (const key of hdrs.keys()) {
							const value = hdrs.get(key);
							if (value !== undefined) {
								carrier[key] = value;
							}
						}
					}
					const extracted = propagation.extract(otContext.active(), carrier);
					const span = trace.getTracer('nats').startSpan(`nats receive ${subject}`, undefined, extracted);

					// Run in ALS for downstream correlation
					this.requestContextService.run(async () => {
						const data = JSON.parse(msg.data.toString());
						this.logger.debug(`Processing message from queue ${queueGroup}: ${subject}`);
						try {
							await handler(data);
							span.end();
						} catch (e) {
							span.recordException(e as any);
							span.setStatus({ code: 2 });
							span.end();
							throw e;
						}
					});

					// In NATS v2, we don't need explicit ack/nak for regular subscriptions
					// Messages are automatically acknowledged
					this.logger.debug(`Successfully processed message: ${subject}`);
				} catch (error) {
					this.logger.error(`Error processing message ${subject}:`, error.stack, { error, subject, queueGroup });
					// In regular subscriptions, we can't NAK - just log the error
				}
			}
		})();

		this.subscriptions.push(subscription);
		this.logger.debug(`Subscribed to ${subject} with queue group: ${queueGroup}`);
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
			// Inject distributed context into headers
			const carrier: Record<string, string> = {};
			propagation.inject(otContext.active(), carrier);

			const message = JSON.stringify({
				...data,
				timestamp: new Date().toISOString(),
			});

			const span = trace.getTracer('nats').startSpan(`nats publish ${subject}`);
			await this.nc.publish(subject, Buffer.from(message), { headers: carrier as any });
			span.end();
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
