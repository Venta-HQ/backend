import { Communication } from '@domains/communication/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Marketplace } from '../types/context-mapping.types';

/**
 * Maps user event data from marketplace domain to communication domain
 */
export function toCommunicationUserEvent(
	data: Marketplace.Events.UserCreated | Marketplace.Events.UserDeleted,
): Communication.Contracts.WebhookRequest {
	if (!data.userId) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: 'userId',
			message: 'Required field is missing',
		});
	}

	return {
		source: 'marketplace',
		event: {
			id: data.userId,
			type: 'user_event',
			data: {
				userId: data.userId,
				timestamp: data.timestamp,
			},
			timestamp: data.timestamp,
		},
	};
}

/**
 * Maps vendor event data from marketplace domain to communication domain
 */
export function toCommunicationVendorEvent(
	data: Marketplace.Events.VendorCreated | Marketplace.Events.VendorDeleted,
): Communication.Contracts.WebhookRequest {
	if (!data.vendorId) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: 'vendorId',
			message: 'Required field is missing',
		});
	}

	return {
		source: 'marketplace',
		event: {
			id: data.vendorId,
			type: 'vendor_event',
			data: {
				vendorId: data.vendorId,
				timestamp: data.timestamp,
			},
			timestamp: data.timestamp,
		},
	};
}

/**
 * Maps subscription event data from marketplace domain to communication domain
 */
export function toCommunicationSubscriptionEvent(
	data: Marketplace.Events.UserSubscriptionChanged,
): Communication.Contracts.WebhookRequest {
	if (!data.userId || !data.subscriptionId) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: !data.userId ? 'userId' : 'subscriptionId',
			message: 'Required field is missing',
		});
	}

	return {
		source: 'marketplace',
		event: {
			id: data.subscriptionId,
			type: 'subscription_event',
			data: {
				userId: data.userId,
				subscriptionId: data.subscriptionId,
				status: data.status,
				timestamp: data.timestamp,
			},
			timestamp: data.timestamp,
		},
	};
}
