import { randomUUID } from 'crypto';
import { ALL_EVENT_SCHEMAS, AvailableEventSubjects, BaseEvent, EventDataMap, EventMetadata } from '@app/eventtypes';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { RequestContextService } from '../../networking/request-context';

@Injectable()
export class EventService {
	private readonly logger = new Logger(EventService.name);
	private readonly appName: string;

	constructor(
		@Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
		@Optional() private readonly requestContextService?: RequestContextService,
		@Optional() private readonly configService?: ConfigService,
	) {
		// Get app name from ConfigService, with fallback
		this.appName = this.configService?.get('APP_NAME') || 'unknown-service';
	}

	/**
	 * Emit an event with automatic schema validation based on subject
	 */
	async emit<TSubject extends AvailableEventSubjects>(
		subject: TSubject,
		data: EventDataMap[TSubject],
		metadata?: EventMetadata,
	): Promise<void> {
		try {
			// Get schema from the unified schemas object
			const schema = ALL_EVENT_SCHEMAS[subject];
			const validatedData = schema ? schema.parse(data) : data;

			// Create standardized event
			const event: BaseEvent = {
				correlationId: metadata?.correlationId || this.requestContextService?.getRequestId(),
				data: validatedData,
				eventId: randomUUID(),
				source: metadata?.source || this.appName,
				timestamp: new Date().toISOString(),
				version: metadata?.version || '1.0',
			};

			// Emit event
			await this.natsClient.emit(subject, event);

			this.logger.log(`Emitted ${subject} event: ${event.eventId}`);
		} catch (error) {
			this.logger.error(`Failed to emit ${subject} event:`, error);
			throw error;
		}
	}
}
