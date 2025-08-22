/**
 * Communication Domain Types
 * Internal domain representations for webhook processing
 */

// Clerk webhook payload (normalized)
export type ClerkUserCreatedEvent = {
	type: 'user.created';
	data: {
		id: string;
		first_name?: string;
		last_name?: string;
		primary_email_address_id?: string;
		email_addresses?: Array<{
			id: string;
			email_address: string;
		}>;
	};
};

export type ClerkUserDeletedEvent = {
	type: 'user.deleted';
	data: {
		id: string;
	};
};

export type ClerkWebhookPayload = ClerkUserCreatedEvent | ClerkUserDeletedEvent;

// RevenueCat webhook payload (normalized)
export type RevenueCatInitialPurchaseEvent = {
	event: {
		type: 'INITIAL_PURCHASE';
		app_user_id: string;
		product_id: string;
		transaction_id: string;
		purchased_at_ms: number;
		expiration_at_ms?: number;
		subscriber_attributes?: {
			clerkUserId?: { value?: string };
		};
	};
};

export type RevenueCatWebhookPayload = RevenueCatInitialPurchaseEvent;

// Generic webhook event structure
export interface WebhookEvent {
	type: string;
	timestamp: string;
	data: Record<string, any>;
}
