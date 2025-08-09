export interface RevenueCatWebhookPayload {
	event: {
		type: 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'EXPIRATION';
		app_user_id: string;
		product_id: string;
		transaction_id: string;
		original_transaction_id: string;
		period_type: 'NORMAL' | 'TRIAL' | 'INTRO';
		purchased_at_ms: number;
		expiration_at_ms: number;
	};
}

// Schema is defined in '../schemas/communication.schemas'
