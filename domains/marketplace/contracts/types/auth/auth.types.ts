/**
 * External authentication service types
 */

/**
 * Clerk user data structure
 */
export interface ClerkUserData {
	id: string;
	email_addresses?: Array<{
		email_address: string;
		verification?: {
			status: 'verified' | 'unverified';
		};
	}>;
	first_name?: string;
	last_name?: string;
	created_at: string;
	updated_at: string;
	metadata?: Record<string, string>;
}

/**
 * RevenueCat user data structure
 */
export interface RevenueCatUserData {
	app_user_id: string;
	original_app_user_id?: string;
	subscriptions?: Record<
		string,
		{
			product_identifier: string;
			purchase_date: string;
			expires_date: string | null;
			store: 'app_store' | 'play_store' | 'stripe';
			ownership_type: 'PURCHASED' | 'FAMILY_SHARED' | 'UNKNOWN';
		}
	>;
	non_subscriptions?: Array<{
		product_identifier: string;
		purchase_date: string;
		store: 'app_store' | 'play_store' | 'stripe';
	}>;
	entitlements?: Record<
		string,
		{
			product_identifier: string;
			expires_date: string | null;
		}
	>;
}

/**
 * RevenueCat subscription event data
 */
export interface RevenueCatSubscriptionData {
	event: {
		type: 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | 'UNCANCELLATION';
		id: string;
		app_user_id: string;
		product_id: string;
		transaction_id: string;
		original_transaction_id?: string;
		purchase_date: string;
		expiration_date?: string;
		environment: 'PRODUCTION' | 'SANDBOX';
	};
	api_version: string;
}
