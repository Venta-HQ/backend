import type { SubscriptionProvider } from '@prisma/client';

export interface SubscriptionCreate {
	userId: string;
	provider: SubscriptionProvider;
	data: {
		eventId: string;
		productId: string;
		transactionId: string;
	};
}
