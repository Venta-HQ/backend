import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';

// Domain types (what we're transforming from)
// TODO: Import from actual event types when they're defined
// gRPC types (what we're transforming to) - import from proto when available
// TODO: Replace with actual proto imports when communication service proto is available

// ============================================================================
// OUTBOUND COMMUNICATION ACL PIPES - Transform domain types to communication gRPC
// ============================================================================

/**
 * User Event to Communication ACL Pipe
 * Transforms marketplace user events to communication service format
 */
@Injectable()
export class UserEventCommunicationACLPipe implements PipeTransform<UserEventData, CommunicationWebhookRequest> {
	transform(value: UserEventData, _metadata: ArgumentMetadata): CommunicationWebhookRequest {
		if (!value.userId) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: 'userId',
				message: 'Required field is missing',
			});
		}

		return {
			source: 'marketplace',
			event: {
				id: crypto.randomUUID(),
				type: `user.${value.eventType}`,
				data: {
					userId: value.userId,
					timestamp: value.timestamp,
					...value.metadata,
				},
				timestamp: value.timestamp,
			},
		};
	}
}

/**
 * Vendor Event to Communication ACL Pipe
 * Transforms marketplace vendor events to communication service format
 */
@Injectable()
export class VendorEventCommunicationACLPipe implements PipeTransform<VendorEventData, CommunicationWebhookRequest> {
	transform(value: VendorEventData, _metadata: ArgumentMetadata): CommunicationWebhookRequest {
		if (!value.vendorId || !value.ownerId) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: !value.vendorId ? 'vendorId' : 'ownerId',
				message: 'Required field is missing',
			});
		}

		return {
			source: 'marketplace',
			event: {
				id: crypto.randomUUID(),
				type: `vendor.${value.eventType}`,
				data: {
					vendorId: value.vendorId,
					ownerId: value.ownerId,
					timestamp: value.timestamp,
					...value.metadata,
				},
				timestamp: value.timestamp,
			},
		};
	}
}

/**
 * Subscription Event to Communication ACL Pipe
 * Transforms marketplace subscription events to communication service format
 */
@Injectable()
export class SubscriptionEventCommunicationACLPipe
	implements PipeTransform<SubscriptionEventData, CommunicationWebhookRequest>
{
	transform(value: SubscriptionEventData, _metadata: ArgumentMetadata): CommunicationWebhookRequest {
		if (!value.userId || !value.subscriptionId) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: !value.userId ? 'userId' : 'subscriptionId',
				message: 'Required field is missing',
			});
		}

		return {
			source: 'marketplace',
			event: {
				id: crypto.randomUUID(),
				type: `subscription.${value.eventType}`,
				data: {
					userId: value.userId,
					subscriptionId: value.subscriptionId,
					status: value.status,
					timestamp: value.timestamp,
					...value.metadata,
				},
				timestamp: value.timestamp,
			},
		};
	}
}

// ============================================================================
// Types (temporary until proto imports are available)
// ============================================================================

interface UserEventData {
	userId: string;
	eventType: 'created' | 'updated' | 'deleted';
	timestamp: string;
	metadata?: Record<string, unknown>;
}

interface VendorEventData {
	vendorId: string;
	ownerId: string;
	eventType: 'created' | 'updated' | 'deleted';
	timestamp: string;
	metadata?: Record<string, unknown>;
}

interface SubscriptionEventData {
	userId: string;
	subscriptionId: string;
	eventType: 'created' | 'updated' | 'cancelled' | 'renewed';
	status: 'active' | 'cancelled' | 'expired';
	timestamp: string;
	metadata?: Record<string, unknown>;
}

interface CommunicationWebhookRequest {
	source: string;
	event: {
		id: string;
		type: string;
		data: Record<string, unknown>;
		timestamp: string;
	};
}
