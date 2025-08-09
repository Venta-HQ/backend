export interface ClerkWebhookPayload {
	id: string;
	object: 'user';
	type: 'user.created' | 'user.updated' | 'user.deleted';
	data: {
		id: string;
		email_addresses: Array<{
			id: string;
			email_address: string;
			verification: {
				status: 'verified' | 'unverified';
			};
		}>;
		first_name: string | null;
		last_name: string | null;
		created_at: number;
		updated_at: number;
	};
}

// Schema is defined in '../schemas/communication.schemas'
