import { AppError, ErrorCodes } from '@venta/nest/errors';
import { ensureRequiredString } from '@venta/utils';

/**
 * Validation utilities for communication domain ACL validation
 */

/**
 * Validates a required string field
 */
export function validateRequiredString(value: string | undefined, fieldName: string): string {
	return ensureRequiredString(value, fieldName);
}

/**
 * Validates webhook payload structure
 */
export function validateWebhookPayload(payload: any, fieldName: string = 'data'): any {
	if (!payload) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: fieldName,
			message: 'Webhook data is required',
		});
	}
	return payload;
}

/**
 * Validates Clerk webhook payload
 */
export function validateClerkWebhook(webhook: any): { type: string; data: any } {
	if (!webhook.type) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: 'type',
			message: 'Webhook event type is required',
		});
	}

	const data = validateWebhookPayload(webhook.data, 'data');

	if (!data.id) {
		throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
			field: 'data.id',
			message: 'User ID is required in webhook data',
		});
	}

	return {
		type: webhook.type,
		data: data,
	};
}

/**
 * Validates RevenueCat webhook payload
 */
export function validateRevenueCatWebhook(webhook: any): {
	event: { type: string; app_user_id: string; product_id?: string };
} {
	if (!webhook.event?.type) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: 'event.type',
			message: 'Webhook event type is required',
		});
	}

	if (!webhook.event?.app_user_id) {
		throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
			field: 'event.app_user_id',
			message: 'User ID is required in webhook event',
		});
	}

	return {
		event: {
			type: webhook.event.type,
			app_user_id: webhook.event.app_user_id,
			product_id: webhook.event.product_id,
		},
	};
}

/**
 * Maps RevenueCat event types to subscription statuses
 */
export function mapEventTypeToStatus(eventType: string): string {
	const statusMap: Record<string, string> = {
		INITIAL_PURCHASE: 'active',
		RENEWAL: 'active',
		CANCELLATION: 'cancelled',
		EXPIRATION: 'expired',
		BILLING_ISSUE: 'past_due',
	};
	return statusMap[eventType] || 'unknown';
}
