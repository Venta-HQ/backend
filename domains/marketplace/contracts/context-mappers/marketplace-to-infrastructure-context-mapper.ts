import { Injectable, Logger } from '@nestjs/common';

/**
 * Context Mapper for Marketplace → Infrastructure domain
 *
 * Translates Marketplace domain concepts to Infrastructure domain concepts
 * for file management, database operations, and messaging infrastructure
 * This is an OUTBOUND context mapper from Marketplace domain
 */
@Injectable()
export class MarketplaceToInfrastructureContextMapper {
	private readonly logger = new Logger(MarketplaceToInfrastructureContextMapper.name);

	// ============================================================================
	// Marketplace → Infrastructure Translation
	// ============================================================================

	/**
	 * Translate marketplace file upload to infrastructure format
	 */
	toInfrastructureFileUpload(file: {
		filename: string;
		buffer: Buffer;
		mimeType: string;
		uploadedBy: string;
		context: 'vendor_profile' | 'user_profile' | 'product_image' | 'document';
	}) {
		this.logger.debug('Translating marketplace file upload to infrastructure format', {
			filename: file.filename,
			context: file.context,
			uploadedBy: file.uploadedBy,
		});

		return {
			fileData: {
				filename: file.filename,
				buffer: file.buffer,
				mimeType: file.mimeType,
			},
			metadata: {
				uploadedBy: file.uploadedBy,
				context: file.context,
				source: 'marketplace',
				timestamp: new Date().toISOString(),
			},
			storageOptions: {
				compression: this.shouldCompress(file.mimeType),
				encryption: this.shouldEncrypt(file.context),
				retention: this.getRetentionPolicy(file.context),
			},
		};
	}

	/**
	 * Translate marketplace file retrieval to infrastructure format
	 */
	toInfrastructureFileRetrieval(fileId: string) {
		this.logger.debug('Translating marketplace file retrieval to infrastructure format', {
			fileId,
		});

		return {
			fileId,
			includeMetadata: true,
			includeUrl: true,
			source: 'marketplace',
		};
	}

	/**
	 * Translate marketplace file deletion to infrastructure format
	 */
	toInfrastructureFileDeletion(fileId: string, deletedBy: string) {
		this.logger.debug('Translating marketplace file deletion to infrastructure format', {
			fileId,
			deletedBy,
		});

		return {
			fileId,
			metadata: {
				deletedBy,
				source: 'marketplace',
				timestamp: new Date().toISOString(),
			},
		};
	}

	/**
	 * Translate marketplace database connection request to infrastructure format
	 */
	toInfrastructureDatabaseConnection(databaseName: string) {
		this.logger.debug('Translating marketplace database connection to infrastructure format', {
			databaseName,
		});

		return {
			databaseName,
			connectionType: 'read_write',
			timeout: 30000, // 30 seconds
			source: 'marketplace',
		};
	}

	/**
	 * Translate marketplace event to infrastructure messaging format
	 */
	toInfrastructureEvent(event: { type: string; data: Record<string, any>; metadata?: Record<string, any> }) {
		this.logger.debug('Translating marketplace event to infrastructure messaging format', {
			eventType: event.type,
		});

		return {
			eventType: event.type,
			eventData: event.data,
			eventMetadata: {
				...event.metadata,
				source: 'marketplace',
				timestamp: new Date().toISOString(),
				version: '1.0',
			},
			publishingOptions: {
				priority: this.getEventPriority(event.type),
				retryAttempts: 3,
				timeout: 5000,
			},
		};
	}

	/**
	 * Translate marketplace event subscription to infrastructure format
	 */
	toInfrastructureEventSubscription(eventTypes: string[]) {
		this.logger.debug('Translating marketplace event subscription to infrastructure format', {
			eventTypes,
		});

		return {
			eventTypes,
			subscriptionOptions: {
				queueGroup: 'marketplace',
				durableName: 'marketplace-subscription',
				maxInFlight: 10,
				ackWait: 30000,
			},
			filterOptions: {
				source: 'marketplace',
				includeMetadata: true,
			},
		};
	}

	// ============================================================================
	// Infrastructure → Marketplace Translation
	// ============================================================================

	/**
	 * Translate infrastructure file response to marketplace format
	 */
	toMarketplaceFileResponse(infrastructureData: {
		fileId: string;
		url: string;
		metadata: {
			filename: string;
			size: number;
			mimeType: string;
			uploadedBy: string;
			uploadedAt: string;
		};
	}) {
		this.logger.debug('Translating infrastructure file response to marketplace format', {
			fileId: infrastructureData.fileId,
		});

		return {
			fileId: infrastructureData.fileId,
			url: infrastructureData.url,
			metadata: {
				filename: infrastructureData.metadata.filename,
				size: infrastructureData.metadata.size,
				mimeType: infrastructureData.metadata.mimeType,
				uploadedBy: infrastructureData.metadata.uploadedBy,
				uploadedAt: infrastructureData.metadata.uploadedAt,
			},
		};
	}

	/**
	 * Translate infrastructure database connection response to marketplace format
	 */
	toMarketplaceDatabaseConnection(infrastructureData: {
		connectionId: string;
		databaseName: string;
		isConnected: boolean;
		connectionDetails?: {
			host: string;
			port: number;
			ssl: boolean;
		};
	}) {
		this.logger.debug('Translating infrastructure database connection to marketplace format', {
			connectionId: infrastructureData.connectionId,
			databaseName: infrastructureData.databaseName,
		});

		return {
			connectionId: infrastructureData.connectionId,
			databaseName: infrastructureData.databaseName,
			isConnected: infrastructureData.isConnected,
			connectionDetails: infrastructureData.connectionDetails,
		};
	}

	/**
	 * Translate infrastructure event to marketplace format
	 */
	toMarketplaceEvent(infrastructureData: {
		type: string;
		data: Record<string, any>;
		metadata?: Record<string, any>;
		timestamp: string;
	}) {
		this.logger.debug('Translating infrastructure event to marketplace format', {
			eventType: infrastructureData.type,
		});

		return {
			type: infrastructureData.type,
			data: infrastructureData.data,
			metadata: infrastructureData.metadata,
			timestamp: infrastructureData.timestamp,
		};
	}

	// ============================================================================
	// Helper Methods
	// ============================================================================

	/**
	 * Determine if file should be compressed based on MIME type
	 */
	private shouldCompress(mimeType: string): boolean {
		const compressibleTypes = [
			'text/',
			'application/json',
			'application/xml',
			'application/javascript',
			'image/svg+xml',
		];

		return compressibleTypes.some((type) => mimeType.startsWith(type));
	}

	/**
	 * Determine if file should be encrypted based on context
	 */
	private shouldEncrypt(context: string): boolean {
		const sensitiveContexts = ['document', 'user_profile'];
		return sensitiveContexts.includes(context);
	}

	/**
	 * Get retention policy based on file context
	 */
	private getRetentionPolicy(context: string): string {
		const retentionPolicies = {
			vendor_profile: '7_years',
			user_profile: '7_years',
			product_image: '3_years',
			document: '10_years',
		};

		return retentionPolicies[context] || '1_year';
	}

	/**
	 * Get event priority based on event type
	 */
	private getEventPriority(eventType: string): 'high' | 'normal' | 'low' {
		const highPriorityEvents = [
			'user.created',
			'user.deleted',
			'vendor.onboarded',
			'vendor.deactivated',
			'payment.completed',
			'payment.failed',
		];

		const lowPriorityEvents = ['user.profile_updated', 'vendor.profile_updated', 'analytics.event'];

		if (highPriorityEvents.includes(eventType)) {
			return 'high';
		}

		if (lowPriorityEvents.includes(eventType)) {
			return 'low';
		}

		return 'normal';
	}

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate marketplace file data before translation
	 */
	validateMarketplaceFileData(file: {
		filename: string;
		buffer: Buffer;
		mimeType: string;
		uploadedBy: string;
		context: 'vendor_profile' | 'user_profile' | 'product_image' | 'document';
	}): boolean {
		const isValid =
			file &&
			typeof file.filename === 'string' &&
			file.filename.length > 0 &&
			Buffer.isBuffer(file.buffer) &&
			file.buffer.length > 0 &&
			typeof file.mimeType === 'string' &&
			file.mimeType.length > 0 &&
			typeof file.uploadedBy === 'string' &&
			file.uploadedBy.length > 0 &&
			['vendor_profile', 'user_profile', 'product_image', 'document'].includes(file.context);

		if (!isValid) {
			this.logger.warn('Invalid marketplace file data', { file });
		}

		return isValid;
	}

	/**
	 * Validate marketplace event data before translation
	 */
	validateMarketplaceEventData(event: {
		type: string;
		data: Record<string, any>;
		metadata?: Record<string, any>;
	}): boolean {
		const isValid =
			event &&
			typeof event.type === 'string' &&
			event.type.length > 0 &&
			typeof event.data === 'object' &&
			event.data !== null &&
			(!event.metadata || typeof event.metadata === 'object');

		if (!isValid) {
			this.logger.warn('Invalid marketplace event data', { event });
		}

		return isValid;
	}

	/**
	 * Validate infrastructure response data
	 */
	validateInfrastructureResponse(data: any): boolean {
		const isValid =
			data &&
			typeof data.fileId === 'string' &&
			typeof data.url === 'string' &&
			data.metadata &&
			typeof data.metadata.filename === 'string';

		if (!isValid) {
			this.logger.warn('Invalid infrastructure response data', { data });
		}

		return isValid;
	}

	/**
	 * Validate file context
	 */
	validateFileContext(context: string): context is 'vendor_profile' | 'user_profile' | 'product_image' | 'document' {
		const validContexts = ['vendor_profile', 'user_profile', 'product_image', 'document'];
		const isValid = validContexts.includes(context);

		if (!isValid) {
			this.logger.warn('Invalid file context', { context });
		}

		return isValid;
	}
}
