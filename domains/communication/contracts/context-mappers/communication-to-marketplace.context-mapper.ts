import { Marketplace } from '@venta/domains/marketplace/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Communication } from '../types/context-mapping.types';

/**
 * Maps user event data from communication domain to marketplace domain
 */
export function toMarketplaceUserEvent(data: Communication.Core.WebhookEvent): Marketplace.Contracts.UserEventData {
	if (!data.data || typeof data.data !== 'object' || !('userId' in data.data)) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: 'userId',
			message: 'Required field is missing in webhook data',
		});
	}

	return {
		userId: data.data.userId as string,
		eventType: data.type as Marketplace.Contracts.UserEventData['eventType'],
		timestamp: data.timestamp,
		metadata: data.data,
	};
}

/**
 * Maps subscription event data from communication domain to marketplace domain
 */
export function toMarketplaceSubscriptionEvent(
	data: Communication.Core.WebhookEvent,
): Marketplace.Events.UserSubscriptionChanged {
	if (
		!data.data ||
		typeof data.data !== 'object' ||
		!('userId' in data.data) ||
		!('subscriptionId' in data.data) ||
		!('status' in data.data)
	) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: !('userId' in data.data) ? 'userId' : !('subscriptionId' in data.data) ? 'subscriptionId' : 'status',
			message: 'Required field is missing in webhook data',
		});
	}

	return {
		userId: data.data.userId as string,
		subscriptionId: data.data.subscriptionId as string,
		status: data.data.status as Marketplace.Core.UserSubscription['status'],
		timestamp: data.timestamp,
	};
}

/**
 * Maps vendor event data from communication domain to marketplace domain
 */
export function toMarketplaceVendorEvent(
	data: Communication.Core.WebhookEvent,
): Marketplace.Events.VendorCreated | Marketplace.Events.VendorDeleted {
	if (!data.data || typeof data.data !== 'object' || !('vendorId' in data.data)) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: 'vendorId',
			message: 'Required field is missing in webhook data',
		});
	}

	return {
		vendorId: data.data.vendorId as string,
		timestamp: data.timestamp,
	};
}
