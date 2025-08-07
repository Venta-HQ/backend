import { Injectable } from '@nestjs/common';
import { BaseContextMapper } from '@app/nest/modules/contracts';

/**
 * Communication → Marketplace Context Mapper
 * 
 * Translates data between Communication and Marketplace domains
 */
@Injectable()
export class CommunicationMarketplaceContextMapper extends BaseContextMapper {
	constructor() {
		super('CommunicationMarketplaceContextMapper');
	}

	getDomain(): string {
		return 'communication';
	}

	getTargetDomain(): string {
		return 'marketplace';
	}

	/**
	 * Translate communication webhook event to marketplace format
	 */
	toMarketplaceWebhookEvent(
		webhookData: {
			type: string;
			data: any;
			timestamp: string;
			source: string;
		},
	) {
		this.logTranslationStart('toMarketplaceWebhookEvent', { type: webhookData.type, source: webhookData.source });

		try {
			// Validate source data
			this.validateSourceData(webhookData);

			// Transform to marketplace format
			const marketplaceEvent = {
				eventType: webhookData.type,
				eventData: webhookData.data,
				occurredAt: webhookData.timestamp,
				source: webhookData.source,
				processedAt: new Date().toISOString(),
			};

			// Validate target data
			this.validateTargetData(marketplaceEvent);

			this.logTranslationSuccess('toMarketplaceWebhookEvent', { type: webhookData.type });
			return marketplaceEvent;
		} catch (error) {
			this.logTranslationError('toMarketplaceWebhookEvent', error, { type: webhookData.type });
			throw error;
		}
	}

	/**
	 * Translate marketplace notification request to communication format
	 */
	toCommunicationNotificationRequest(
		notificationRequest: {
			userId: string;
			type: 'email' | 'sms' | 'push';
			template: string;
			data: Record<string, any>;
			priority?: 'low' | 'normal' | 'high';
		},
	) {
		this.logTranslationStart('toCommunicationNotificationRequest', { userId: notificationRequest.userId, type: notificationRequest.type });

		try {
			// Validate source data
			this.validateSourceData(notificationRequest);

			// Transform to communication format
			const communicationRequest = {
				recipient: notificationRequest.userId,
				channel: notificationRequest.type,
				templateId: notificationRequest.template,
				variables: notificationRequest.data,
				priority: notificationRequest.priority || 'normal',
				scheduledAt: new Date().toISOString(),
			};

			// Validate target data
			this.validateTargetData(communicationRequest);

			this.logTranslationSuccess('toCommunicationNotificationRequest', { userId: notificationRequest.userId });
			return communicationRequest;
		} catch (error) {
			this.logTranslationError('toCommunicationNotificationRequest', error, { userId: notificationRequest.userId });
			throw error;
		}
	}

	/**
	 * Translate communication delivery status to marketplace format
	 */
	toMarketplaceDeliveryStatus(
		deliveryStatus: {
			messageId: string;
			status: 'sent' | 'delivered' | 'failed' | 'bounced';
			timestamp: string;
			details?: Record<string, any>;
		},
	) {
		this.logTranslationStart('toMarketplaceDeliveryStatus', { messageId: deliveryStatus.messageId, status: deliveryStatus.status });

		try {
			// Validate source data
			this.validateSourceData(deliveryStatus);

			// Transform to marketplace format
			const marketplaceStatus = {
				notificationId: deliveryStatus.messageId,
				status: deliveryStatus.status,
				updatedAt: deliveryStatus.timestamp,
				metadata: deliveryStatus.details || {},
			};

			// Validate target data
			this.validateTargetData(marketplaceStatus);

			this.logTranslationSuccess('toMarketplaceDeliveryStatus', { messageId: deliveryStatus.messageId });
			return marketplaceStatus;
		} catch (error) {
			this.logTranslationError('toMarketplaceDeliveryStatus', error, { messageId: deliveryStatus.messageId });
			throw error;
		}
	}

	/**
	 * Translate marketplace webhook configuration to communication format
	 */
	toCommunicationWebhookConfig(
		webhookConfig: {
			url: string;
			events: string[];
			secret?: string;
			headers?: Record<string, string>;
		},
	) {
		this.logTranslationStart('toCommunicationWebhookConfig', { url: webhookConfig.url, events: webhookConfig.events });

		try {
			// Validate source data
			this.validateSourceData(webhookConfig);

			// Transform to communication format
			const communicationConfig = {
				endpoint: webhookConfig.url,
				eventTypes: webhookConfig.events,
				authentication: webhookConfig.secret ? { type: 'secret', value: webhookConfig.secret } : undefined,
				customHeaders: webhookConfig.headers || {},
				active: true,
			};

			// Validate target data
			this.validateTargetData(communicationConfig);

			this.logTranslationSuccess('toCommunicationWebhookConfig', { url: webhookConfig.url });
			return communicationConfig;
		} catch (error) {
			this.logTranslationError('toCommunicationWebhookConfig', error, { url: webhookConfig.url });
			throw error;
		}
	}

	// ============================================================================
	// ABSTRACT METHOD IMPLEMENTATIONS
	// ============================================================================

	validateSourceData(data: any): boolean {
		if (!data) {
			throw this.createValidationError('Source data is required', { data });
		}

		// Additional validation based on data structure
		if (data.type && typeof data.type !== 'string') {
			throw this.createValidationError('Invalid type format', { data });
		}

		return true;
	}

	validateTargetData(data: any): boolean {
		if (!data) {
			throw this.createValidationError('Target data is required', { data });
		}

		// Additional validation based on data structure
		if (data.eventType && typeof data.eventType !== 'string') {
			throw this.createValidationError('Invalid event type format', { data });
		}

		return true;
	}
} 