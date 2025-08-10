import { ArgumentMetadata, Injectable, Logger, PipeTransform } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { DomainEventSchema, SubscriptionOptionsSchema } from '../../schemas/search/search.schemas';
import type { DomainEvent, SubscriptionOptions } from '../../types/internal';

// ============================================================================
// EXTERNAL NATS ACL PIPES - Transform NATS types to domain types
// ============================================================================

/**
 * NATS Subscription Options ACL Pipe
 * Validates and transforms subscription options
 */
@Injectable()
export class NatsSubscriptionOptionsACLPipe implements PipeTransform<unknown, SubscriptionOptions> {
	private validator = new SchemaValidatorPipe(SubscriptionOptionsSchema);

	transform(value: unknown, metadata: ArgumentMetadata): SubscriptionOptions {
		return this.validator.transform(value, metadata);
	}
}

/**
 * NATS Domain Event ACL Pipe
 * Validates and transforms domain events
 */
@Injectable()
export class NatsDomainEventACLPipe<T = unknown> implements PipeTransform<unknown, DomainEvent<T>> {
	private validator = new SchemaValidatorPipe(DomainEventSchema);

	transform(value: unknown, metadata: ArgumentMetadata): DomainEvent<T> {
		return this.validator.transform(value, metadata);
	}
}
