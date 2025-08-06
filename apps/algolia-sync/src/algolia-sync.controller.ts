import { AvailableEventSubjects, BaseEvent } from '@app/apitypes';
import { NatsQueueService, NatsRequestIdInterceptor } from '@app/nest/modules';
import { Injectable, Logger, OnModuleInit, UseInterceptors } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';

/**
 * NATS consumer for Algolia sync operations.
 *
 * This controller automatically extracts correlation IDs from NATS messages
 * using the NatsRequestIdInterceptor, making them available to all log messages.
 *
 * The same pattern can be applied to any other NATS consumer in the system.
 */
@Injectable()
@UseInterceptors(NatsRequestIdInterceptor)
export class AlgoliaSyncController implements OnModuleInit {
	private readonly logger = new Logger(AlgoliaSyncController.name);

	constructor(
		private readonly natsQueueService: NatsQueueService,
		private readonly algoliaSyncService: AlgoliaSyncService,
	) {}

	async onModuleInit() {
		// Set up queue subscriptions for all vendor events
		// This ensures only ONE instance processes each event
		this.natsQueueService.subscribeToQueue(
			'vendor.>', // Wildcard pattern for all vendor events
			'algolia-sync-workers', // Queue group name - all instances share this
			this.handleVendorEvent.bind(this),
		);

		this.logger.log('Algolia sync controller initialized with queue groups');
	}

	private async handleVendorEvent(data: { data: BaseEvent; subject: string }): Promise<void> {
		const { data: event, subject } = data;

		// Correlation ID is automatically available in logs via the interceptor
		this.logger.log(`Handling ${subject} event: ${event.eventId} for vendor: ${event.data.id}`);

		try {
			await this.algoliaSyncService.processVendorEvent(event, subject as AvailableEventSubjects);
		} catch (error) {
			this.logger.error(`Failed to handle ${subject} event: ${event.eventId} for vendor ${event.data.id}:`, error);
			throw error;
		}
	}
}
