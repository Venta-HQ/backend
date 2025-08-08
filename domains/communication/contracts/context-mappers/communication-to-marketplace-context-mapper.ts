import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';
import { Communication } from '../types/context-mapping.types';
import { ClerkWebhookPayload } from '../types/external/clerk.types';
import { RevenueCatWebhookPayload } from '../types/external/revenuecat.types';

/**
 * Context Mapper for translating between Communication and Marketplace domains
 */
@Injectable()
export class CommunicationToMarketplaceContextMapper {
	private readonly logger = new Logger(CommunicationToMarketplaceContextMapper.name);

	/**
	 * Convert webhook event to marketplace user event
	 */
	toMarketplaceUserEvent(event: Communication.WebhookEvent<ClerkWebhookPayload>): Marketplace.Events.UserCreated {
		return {
			userId: event.payload.data.id,
			timestamp: event.timestamp,
		};
	}

	/**
	 * Convert webhook event to marketplace subscription event
	 */
	toMarketplaceSubscriptionEvent(
		event: Communication.WebhookEvent<RevenueCatWebhookPayload>,
	): Marketplace.Events.UserSubscriptionChanged {
		const subscriptionId = event.payload.event.transaction_id;
		const status = this.getSubscriptionStatus(event.payload.event.type);

		return {
			userId: event.payload.event.app_user_id,
			subscriptionId,
			status,
			timestamp: event.timestamp,
		};
	}

	/**
	 * Get subscription status from webhook event type
	 */
	private getSubscriptionStatus(
		type: RevenueCatWebhookPayload['event']['type'],
	): Marketplace.Core.UserSubscription['status'] {
		switch (type) {
			case 'INITIAL_PURCHASE':
			case 'RENEWAL':
				return 'active';
			case 'CANCELLATION':
				return 'cancelled';
			case 'EXPIRATION':
				return 'expired';
			default:
				throw new Error(`Unsupported subscription event type: ${type}`);
		}
	}
}
