import { Injectable } from '@nestjs/common';
import { Marketplace } from '../types/context-mapping.types';

/**
 * Context mapper for translating between Marketplace and Communication domains
 */
@Injectable()
export class MarketplaceToCommunicationContextMapper {
	/**
	 * Convert user event to communication webhook event
	 */
	toCommunicationWebhookEvent(event: {
		type: string;
		data: {
			userId: string;
			[key: string]: unknown;
		};
		timestamp: string;
		source: string;
	}): Communication.Contracts.WebhookEvent {
		return {
			type: event.type,
			payload: event.data,
			timestamp: event.timestamp,
			source: event.source,
			metadata: {
				domain: 'marketplace',
				subdomain: 'user-management',
				eventId: `${event.type}_${event.data.userId}_${Date.now()}`,
			},
		};
	}

	/**
	 * Convert subscription event to communication webhook event
	 */
	toCommunicationSubscriptionEvent(event: {
		type: string;
		data: {
			userId: string;
			subscriptionId: string;
			[key: string]: unknown;
		};
		timestamp: string;
		source: string;
	}): Communication.Contracts.WebhookEvent {
		return {
			type: event.type,
			payload: event.data,
			timestamp: event.timestamp,
			source: event.source,
			metadata: {
				domain: 'marketplace',
				subdomain: 'user-management',
				eventId: `${event.type}_${event.data.subscriptionId}_${Date.now()}`,
			},
		};
	}

	/**
	 * Convert vendor event to communication webhook event
	 */
	toCommunicationVendorEvent(event: {
		type: string;
		data: {
			vendorId: string;
			[key: string]: unknown;
		};
		timestamp: string;
		source: string;
	}): Communication.Contracts.WebhookEvent {
		return {
			type: event.type,
			payload: event.data,
			timestamp: event.timestamp,
			source: event.source,
			metadata: {
				domain: 'marketplace',
				subdomain: 'vendor-management',
				eventId: `${event.type}_${event.data.vendorId}_${Date.now()}`,
			},
		};
	}
}
