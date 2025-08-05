import { randomUUID } from 'crypto';
import { ALL_EVENT_SCHEMAS, AvailableEventSubjects, BaseEvent, EventDataMap, EventMetadata } from '@app/apitypes';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RequestContextService } from '../request-context';

@Injectable()
export class EventService {
	private readonly logger = new Logger(EventService.name);
	private readonly serviceName: string;

	constructor(
		@Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
		@Optional() private readonly requestContextService?: RequestContextService,
	) {
		this.serviceName = process.env.SERVICE_NAME || 'unknown-service';
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
				correlationId: metadata?.correlationId || this.requestContextService?.get('requestId'),
				data: validatedData,
				eventId: randomUUID(),
				source: metadata?.source || this.serviceName,
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
