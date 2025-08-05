import { randomUUID } from 'crypto';
import { AvailableEventSubjects, BaseEvent, EventMetadata, eventRegistry } from '@app/apitypes';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class EventService {
	private readonly logger = new Logger(EventService.name);
	private readonly serviceName: string;

	constructor(@Inject('NATS_SERVICE') private readonly natsClient: ClientProxy) {
		this.serviceName = process.env.SERVICE_NAME || 'unknown-service';
	}

	/**
	 * Emit an event with automatic schema validation based on subject
	 */
	async emit<T = any>(subject: AvailableEventSubjects, data: T, metadata?: EventMetadata): Promise<void> {
		try {
			// Get schema from registry if available
			const schema = eventRegistry.getSchema(subject);
			const validatedData = schema ? schema.parse(data) : data;

			// Create standardized event
			const event: BaseEvent = {
				correlationId: metadata?.correlationId,
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

	/**
	 * Emit an event without validation (for performance when validation isn't needed)
	 */
	async emitUnvalidated<T = any>(subject: string, data: T, metadata?: EventMetadata): Promise<void> {
		try {
			// Create standardized event without validation
			const event: BaseEvent = {
				correlationId: metadata?.correlationId,
				data,
				eventId: randomUUID(),
				source: metadata?.source || this.serviceName,
				timestamp: new Date().toISOString(),
				version: metadata?.version || '1.0',
			};

			// Emit event
			await this.natsClient.emit(subject, event);

			this.logger.log(`Emitted ${subject} event (unvalidated): ${event.eventId}`);
		} catch (error) {
			this.logger.error(`Failed to emit ${subject} event:`, error);
			throw error;
		}
	}
}
