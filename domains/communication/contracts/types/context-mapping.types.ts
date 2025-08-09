// Schemas moved to ../schemas/communication.schemas

export namespace Communication {
	export namespace Core {
		export interface WebhookEvent {
			id: string;
			type: string;
			data: Record<string, unknown>;
			timestamp: string;
		}

		export interface NotificationData {
			recipientId: string;
			type: string;
			message: string;
			metadata?: Record<string, unknown>;
		}
	}

	export namespace Contracts {
		export interface WebhookRequest {
			source: string;
			event: Core.WebhookEvent;
			signature?: string;
		}

		export interface NotificationRequest {
			recipientId: string;
			type: string;
			message: string;
			metadata?: Record<string, unknown>;
		}
	}

	export namespace Internal {
		export interface WebhookProcessingResult {
			eventId: string;
			status: 'success' | 'failure';
			error?: string;
		}

		export interface NotificationResult {
			recipientId: string;
			status: 'sent' | 'failed';
			error?: string;
		}
	}

	// Validation schemas are available from '../schemas/communication.schemas'
}
