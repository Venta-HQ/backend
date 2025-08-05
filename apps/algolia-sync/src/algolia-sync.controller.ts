import { NatsQueueService } from '@app/nest/modules';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AlgoliaSyncService } from './algolia-sync.service';

@Injectable()
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

	private async handleVendorEvent(data: { data: any; subject: string }): Promise<void> {
		const { data: vendor, subject } = data;
		this.logger.log(`Handling ${subject} event for vendor: ${vendor.id}`);

		try {
			await this.algoliaSyncService.processVendorEvent(subject, vendor);
		} catch (error) {
			this.logger.error(`Failed to handle ${subject} event for vendor ${vendor.id}:`, error);
			throw error;
		}
	}
} 