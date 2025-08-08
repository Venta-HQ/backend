import { Logger } from '@nestjs/common';

/**
 * Communication Contract Utilities
 * 
 * Domain-specific utilities for communication contract operations.
 * Contains validation and transformation logic specific to the communication domain.
 */
export class CommunicationContractUtils {
	private static logger = new Logger('CommunicationContractUtils');

	// ============================================================================
	// Communication Data Validation
	// ============================================================================

	/**
	 * Validate webhook event data for communication services
	 */
	static validateWebhookEvent(eventData: {
		eventType: string;
		payload: any;
		source: string;
		timestamp: string;
	}): boolean {
		const isValid =
			eventData &&
			typeof eventData.eventType === 'string' &&
			eventData.eventType.length > 0 &&
			eventData.payload &&
			typeof eventData.source === 'string' &&
			eventData.source.length > 0 &&
			typeof eventData.timestamp === 'string' &&
			eventData.timestamp.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid webhook event data for communication services', { eventData });
		}

		return isValid;
	}

	/**
	 * Validate notification request data for communication services
	 */
	static validateNotificationRequest(notificationData: {
		recipientId: string;
		message: string;
		type: string;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			notificationData &&
			typeof notificationData.recipientId === 'string' &&
			notificationData.recipientId.length > 0 &&
			typeof notificationData.message === 'string' &&
			notificationData.message.length > 0 &&
			typeof notificationData.type === 'string' &&
			notificationData.type.length > 0 &&
			(!notificationData.metadata || typeof notificationData.metadata === 'object');

		if (!isValid) {
			this.logger.warn('Invalid notification request data for communication services', { notificationData });
		}

		return isValid;
	}

	/**
	 * Validate delivery status data for communication services
	 */
	static validateDeliveryStatus(statusData: {
		messageId: string;
		status: string;
		timestamp: string;
		details?: Record<string, any>;
	}): boolean {
		const isValid =
			statusData &&
			typeof statusData.messageId === 'string' &&
			statusData.messageId.length > 0 &&
			typeof statusData.status === 'string' &&
			statusData.status.length > 0 &&
			typeof statusData.timestamp === 'string' &&
			statusData.timestamp.length > 0 &&
			(!statusData.details || typeof statusData.details === 'object');

		if (!isValid) {
			this.logger.warn('Invalid delivery status data for communication services', { statusData });
		}

		return isValid;
	}

	// ============================================================================
	// Communication Data Transformation
	// ============================================================================

	/**
	 * Transform webhook event to communication format
	 */
	static transformWebhookEvent(eventData: {
		eventType: string;
		payload: any;
		source: string;
		timestamp: string;
	}) {
		return {
			type: eventData.eventType,
			data: eventData.payload,
			source: eventData.source,
			receivedAt: eventData.timestamp,
			processedAt: new Date().toISOString(),
		};
	}

	/**
	 * Transform notification request to communication format
	 */
	static transformNotificationRequest(notificationData: {
		recipientId: string;
		message: string;
		type: string;
		metadata?: Record<string, any>;
	}) {
		return {
			recipient: notificationData.recipientId,
			content: notificationData.message,
			notificationType: notificationData.type,
			attributes: notificationData.metadata || {},
			createdAt: new Date().toISOString(),
		};
	}
} 