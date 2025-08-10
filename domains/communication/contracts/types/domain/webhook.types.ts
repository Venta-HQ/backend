/**
 * Communication Domain Types
 * Internal domain representations for webhook processing
 */

// Clerk webhook payload (normalized)
export interface ClerkWebhookPayload {
	type: string;
	data: {
		id: string;
		email_addresses: Array<{
			email_address: string;
			id: string;
		}>;
		first_name?: string;
		last_name?: string;
		created_at?: number;
		updated_at?: number;
		[key: string]: any;
	};
}

// RevenueCat webhook payload (normalized)
export interface RevenueCatWebhookPayload {
	event: {
		type: string;
		app_user_id: string;
		product_id?: string;
		period_type?: string;
		purchased_at_ms?: number;
		expiration_at_ms?: number;
		[key: string]: any;
	};
}

// Generic webhook event structure
export interface WebhookEvent {
	type: string;
	timestamp: string;
	data: Record<string, any>;
}
