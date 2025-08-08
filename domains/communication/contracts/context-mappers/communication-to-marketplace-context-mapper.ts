import { AppError, ErrorCodes } from '@app/nest/errors';
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
		if (!event?.payload?.data?.id || !event.timestamp) {
			throw AppError.validation('MISSING_REQUIRED_FIELD', ErrorCodes.MISSING_REQUIRED_FIELD, {
				operation: 'to_marketplace_user_event',
				field: !event?.payload?.data?.id ? 'payload.data.id' : 'timestamp',
			});
		}

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
		if (!event?.payload?.event?.transaction_id || !event?.payload?.event?.app_user_id || !event.timestamp) {
			throw AppError.validation('MISSING_REQUIRED_FIELD', ErrorCodes.MISSING_REQUIRED_FIELD, {
				operation: 'to_marketplace_subscription_event',
				field: !event?.payload?.event?.transaction_id
					? 'payload.event.transaction_id'
					: !event?.payload?.event?.app_user_id
						? 'payload.event.app_user_id'
						: 'timestamp',
			});
		}

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
				throw AppError.validation('INVALID_SUBSCRIPTION_DATA', ErrorCodes.INVALID_SUBSCRIPTION_DATA, {
					operation: 'get_subscription_status',
					eventType: type,
				});
		}
	}
}
