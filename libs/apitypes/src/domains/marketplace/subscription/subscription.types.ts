export type RevenueCatWebhookEvent<T> = {
	api_version: string;
	event: T;
};

export enum RevenueCatHandledEventTypes {
	INITIAL_PURCHASE = 'INITIAL_PURCHASE',
}

export type RevenueCatInitialPurchaseEventData = {
	aliases: string[];
	app_id: string;
	app_user_id: string;
	country_code: string;
	currency: string;
	entitlement_id: null;
	entitlement_ids: string[];
	environment: string;
	event_timestamp_ms: number;
	expiration_at_ms: number;
	id: string;
	is_family_share: false;
	offer_code: null;
	original_app_user_id: string;
	original_transaction_id: string;
	period_type: string;
	presented_offering_id: null;
	price: number;
	price_in_purchased_currency: number;
	product_id: string;
	purchased_at_ms: number;
	store: string;
	subscriber_attributes: {
		clerkUserId: string;
	};
	takehome_percentage: number;
	transaction_id: string;
	type: string;
};
