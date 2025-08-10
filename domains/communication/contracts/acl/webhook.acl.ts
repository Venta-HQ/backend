import { AppError, ErrorCodes } from '@venta/nest/errors';
import { ClerkWebhookPayload, RevenueCatWebhookPayload } from '../types/domain';

/**
 * Webhook Event ACL
 * Handles validation and transformation of webhook events from external services
 */

/**
 * Clerk Webhook ACL
 * Transforms Clerk webhook events to marketplace domain events
 */
export class ClerkWebhookACL {
	// External → gRPC (inbound)
	static validate(webhook: ClerkWebhookPayload): void {
		if (!webhook.type) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'type',
				message: 'Webhook event type is required',
			});
		}
		if (!webhook.data) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'data',
				message: 'Webhook data is required',
			});
		}
	}

	static toUserEvent(webhook: ClerkWebhookPayload): {
		userId: string;
		eventType: string;
		timestamp: string;
		metadata: any;
	} {
		this.validate(webhook);

		if (!webhook.data.id) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
				field: 'userId',
				message: 'User ID is required in webhook data',
			});
		}

		return {
			userId: webhook.data.id,
			eventType: webhook.type,
			timestamp: new Date().toISOString(),
			metadata: webhook.data,
		};
	}
}

/**
 * RevenueCat Webhook ACL
 * Transforms RevenueCat webhook events to marketplace domain events
 */
export class RevenueCatWebhookACL {
	// External → gRPC (inbound)
	static validate(webhook: RevenueCatWebhookPayload): void {
		if (!webhook.event?.type) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'event.type',
				message: 'Webhook event type is required',
			});
		}
		if (!webhook.event?.app_user_id) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'event.app_user_id',
				message: 'User ID is required in webhook event',
			});
		}
	}

	static toSubscriptionEvent(webhook: RevenueCatWebhookPayload): {
		userId: string;
		subscriptionId?: string;
		status: string;
		timestamp: string;
		metadata: any;
	} {
		this.validate(webhook);

		return {
			userId: webhook.event.app_user_id,
			subscriptionId: webhook.event.product_id,
			status: this.mapEventTypeToStatus(webhook.event.type),
			timestamp: new Date().toISOString(),
			metadata: webhook.event,
		};
	}

	private static mapEventTypeToStatus(eventType: string): string {
		const statusMap: Record<string, string> = {
			INITIAL_PURCHASE: 'active',
			RENEWAL: 'active',
			CANCELLATION: 'cancelled',
			EXPIRATION: 'expired',
			BILLING_ISSUE: 'past_due',
		};
		return statusMap[eventType] || 'unknown';
	}
}
