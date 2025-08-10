// Validation utilities
import { mapEventTypeToStatus, validateClerkWebhook, validateRevenueCatWebhook } from '../schemas/validation.utils';
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
		validateClerkWebhook(webhook);
	}

	static toUserEvent(webhook: ClerkWebhookPayload): {
		userId: string;
		eventType: string;
		timestamp: string;
		metadata: any;
	} {
		const validated = validateClerkWebhook(webhook);

		return {
			userId: validated.data.id,
			eventType: validated.type,
			timestamp: new Date().toISOString(),
			metadata: validated.data,
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
		validateRevenueCatWebhook(webhook);
	}

	static toSubscriptionEvent(webhook: RevenueCatWebhookPayload): {
		userId: string;
		subscriptionId?: string;
		status: string;
		timestamp: string;
		metadata: any;
	} {
		const validated = validateRevenueCatWebhook(webhook);

		return {
			userId: validated.event.app_user_id,
			subscriptionId: validated.event.product_id,
			status: mapEventTypeToStatus(validated.event.type),
			timestamp: new Date().toISOString(),
			metadata: webhook.event,
		};
	}
}
