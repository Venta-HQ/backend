import { Injectable, Logger } from '@nestjs/common';
import { ValidationUtils } from '@app/utils';

/**
 * Communication → Marketplace Context Mapper
 * 
 * Translates data between Communication and Marketplace domains
 */
@Injectable()
export class CommunicationMarketplaceContextMapper {
	private readonly logger = new Logger('CommunicationMarketplaceContextMapper');

	/**
	 * Validate webhook data
	 */
	private validateWebhookData(data: any): boolean {
		return data && 
			typeof data.type === 'string' && 
			data.data && 
			typeof data.timestamp === 'string' &&
			typeof data.source === 'string';
	}

	/**
	 * Validate notification request data
	 */
	private validateNotificationRequest(data: any): boolean {
		return data && 
			typeof data.userId === 'string' &&
			['email', 'sms', 'push'].includes(data.type) &&
			typeof data.template === 'string' &&
			typeof data.data === 'object';
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
		try {
			// Validate source data
			if (!this.validateWebhookData(webhookData)) {
				throw new Error('Invalid webhook data');
			}

			// Transform to marketplace format
			const marketplaceEvent = {
				eventType: webhookData.type,
				eventData: webhookData.data,
				occurredAt: webhookData.timestamp,
				source: webhookData.source,
				processedAt: new Date().toISOString(),
			};

			return marketplaceEvent;
		} catch (error) {
			this.logger.error('Failed to translate webhook event', error);
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
		try {
			// Validate source data
			if (!this.validateNotificationRequest(notificationRequest)) {
				throw new Error('Invalid notification request data');
			}

			// Transform to communication format
			const communicationRequest = {
				recipient: notificationRequest.userId,
				channel: notificationRequest.type,
				templateId: notificationRequest.template,
				variables: notificationRequest.data,
				priority: notificationRequest.priority || 'normal',
				scheduledAt: new Date().toISOString(),
			};

			return communicationRequest;
		} catch (error) {
			this.logger.error('Failed to translate notification request', error);
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
		try {
			// Validate source data
			if (!deliveryStatus?.messageId || !deliveryStatus?.status || !deliveryStatus?.timestamp) {
				throw new Error('Invalid delivery status data');
			}

			// Transform to marketplace format
			const marketplaceStatus = {
				notificationId: deliveryStatus.messageId,
				status: deliveryStatus.status,
				updatedAt: deliveryStatus.timestamp,
				metadata: deliveryStatus.details || {},
			};

			return marketplaceStatus;
		} catch (error) {
			this.logger.error('Failed to translate delivery status', error);
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
		try {
			// Validate source data
			if (!webhookConfig?.url || !webhookConfig?.events?.length) {
				throw new Error('Invalid webhook configuration data');
			}

			// Transform to communication format
			const communicationConfig = {
				endpoint: webhookConfig.url,
				eventTypes: webhookConfig.events,
				authentication: webhookConfig.secret ? { type: 'secret', value: webhookConfig.secret } : undefined,
				customHeaders: webhookConfig.headers || {},
				active: true,
			};

			return communicationConfig;
		} catch (error) {
			this.logger.error('Failed to translate webhook configuration', error);
			throw error;
		}
	}


} 