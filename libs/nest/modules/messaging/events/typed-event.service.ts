import { randomUUID } from 'crypto';
import { z } from 'zod';
import { ALL_EVENT_SCHEMAS, AvailableEventSubjects, BaseEvent, EventDataMap } from '@domains/marketplace/events';
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
	 * Emit an event with automatic schema validation and domain context
	 */
	async emit<TSubject extends AvailableEventSubjects>(subject: TSubject, data: EventDataMap[TSubject]): Promise<void> {
		try {
			// Get schema from the unified schemas object
			const schema = ALL_EVENT_SCHEMAS[subject] as z.ZodSchema;
			const validatedData = schema ? schema.parse(data) : data;

			// Extract context from schema metadata
			const context = this.extractContextFromSchema(schema, validatedData);

			// Create standardized event with automatic domain context
			const event: BaseEvent = {
				context: context,
				meta: {
					correlationId: this.requestContextService?.getRequestId(),
					domain: this.extractDomainFromSubject(subject),
					eventId: randomUUID(),
					source: this.appName,
					subdomain: this.extractSubdomainFromSubject(subject),
					timestamp: new Date().toISOString(),
					version: '1.0',
				},
				data: validatedData,
			};

			// Emit event
			await this.natsClient.emit(subject, event);

			this.logger.log(`Emitted domain event: ${subject}`, {
				context: event.context,
				domain: event.meta.domain,
				eventId: event.meta.eventId,
				subdomain: event.meta.subdomain,
			});
		} catch (error) {
			this.logger.error(`Failed to emit domain event: ${subject}`, error.stack, { error, subject });
			throw error;
		}
	}

	private extractDomainFromSubject(subject: string): string {
		return subject.split('.')[0]; // 'marketplace.vendor.onboarded' -> 'marketplace'
	}

	private extractSubdomainFromSubject(subject: string): string | undefined {
		const parts = subject.split('.');
		return parts.length > 2 ? parts[1] : undefined; // 'marketplace.vendor.onboarded' -> 'vendor'
	}

	/**
	 * Extract context from schema metadata
	 * Schema-driven approach that's type-safe and explicit
	 */
	private extractContextFromSchema(schema: z.ZodSchema, data: any): Record<string, any> | undefined {
		// Check if schema has context metadata
		const contextConfig = schema ? (schema as any)._context : undefined;

		const context: Record<string, any> = {};

		// Always include requestId and sessionId for correlation
		const requestId = this.requestContextService?.getRequestId();
		if (requestId) {
			context.requestId = requestId;
		}

		// Extract fields marked as context from schema
		if (contextConfig?.fields) {
			for (const field of contextConfig.fields) {
				if (data[field]) {
					context[field] = data[field];
				}
			}
		}

		// Use custom extraction function if provided
		if (contextConfig?.extract) {
			const customContext = contextConfig.extract(data);
			Object.assign(context, customContext);
		}

		return Object.keys(context).length > 0 ? context : undefined;
	}
}
