import { AvailableEventSubjects, BaseEvent } from '@app/apitypes';
import { NatsQueueService, RequestContextService } from '@app/nest/modules';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';

@Injectable()
export class AlgoliaSyncController implements OnModuleInit {
	private readonly logger = new Logger(AlgoliaSyncController.name);

	constructor(
		private readonly natsQueueService: NatsQueueService,
		private readonly algoliaSyncService: AlgoliaSyncService,
		private readonly requestContextService: RequestContextService,
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

		// Set correlation ID from event for request context
		if (event.correlationId) {
			this.requestContextService.set('requestId', event.correlationId);
		}

		this.logger.log(`Handling ${subject} event: ${event.eventId} for vendor: ${event.data.id}`);

		try {
			await this.algoliaSyncService.processVendorEvent(event, subject as AvailableEventSubjects);
		} catch (error) {
			this.logger.error(`Failed to handle ${subject} event: ${event.eventId} for vendor ${event.data.id}:`, error);
			throw error;
		}
	}
}
