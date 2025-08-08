import { Injectable, Logger } from '@nestjs/common';
import { InfrastructureDomainMapping, InfrastructureMarketplaceMapping } from '../types';

/**
 * Infrastructure to Marketplace Context Mapper
 *
 * Translates infrastructure domain data structures to marketplace domain data structures.
 * This is a directional mapper - it only handles infrastructure -> marketplace translations.
 */
@Injectable()
export class InfrastructureToMarketplaceContextMapper {
	private readonly logger = new Logger(InfrastructureToMarketplaceContextMapper.name);

	/**
	 * Maps infrastructure file upload to marketplace format
	 */
	toMarketplaceFileManagement(
		fileUpload: InfrastructureDomainMapping['fileUpload'],
		operation: InfrastructureMarketplaceMapping['marketplaceFileManagement']['operation'],
	): InfrastructureMarketplaceMapping['marketplaceFileManagement'] {
		this.logger.debug('Mapping infrastructure file upload to marketplace format', {
			fileId: fileUpload.fileId,
			operation,
			context: fileUpload.metadata.uploadedBy,
		});

		return {
			operation,
			fileId: fileUpload.fileId,
			context: this.determineFileContext(fileUpload.metadata.mimeType),
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Maps infrastructure database operation to marketplace format
	 */
	toMarketplaceDatabase(
		operation: InfrastructureMarketplaceMapping['marketplaceDatabase']['operation'],
		table: InfrastructureMarketplaceMapping['marketplaceDatabase']['table'],
	): InfrastructureMarketplaceMapping['marketplaceDatabase'] {
		this.logger.debug('Mapping infrastructure database operation to marketplace format', {
			operation,
			table,
		});

		return {
			operation,
			table,
			timestamp: new Date().toISOString(),
		};
	}

	/**
	 * Determines file context based on mime type and other metadata
	 */
	private determineFileContext(
		mimeType: string,
	): InfrastructureMarketplaceMapping['marketplaceFileManagement']['context'] {
		if (mimeType.startsWith('image/')) {
			return 'product_image';
		}
		if (mimeType === 'application/pdf') {
			return 'document';
		}
		// Default to user_profile if context can't be determined
		return 'user_profile';
	}
}
