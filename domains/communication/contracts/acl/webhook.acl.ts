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
	} {
		const validated = validateClerkWebhook(webhook);

		return {
			userId: validated.data.id,
			eventType: validated.type,
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
		productId: string;
		transactionId: string;
		eventId: string;
		status: string;
	} {
		const validated = validateRevenueCatWebhook(webhook);

		// Prefer Clerk user id from subscriber attributes when present
		const clerkUserId = validated.event.subscriber_attributes?.clerkUserId?.value;
		const userId = clerkUserId || validated.event.app_user_id;

		return {
			userId,
			productId: validated.event.product_id,
			transactionId: validated.event.transaction_id,
			eventId: validated.event.id || validated.event.transaction_id,
			status: mapEventTypeToStatus(validated.event.type),
		};
	}
}
