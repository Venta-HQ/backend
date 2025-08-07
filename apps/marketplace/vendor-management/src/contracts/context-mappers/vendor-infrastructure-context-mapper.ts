import { Injectable } from '@nestjs/common';
import { BaseContextMapper } from '@app/nest/modules/contracts';

/**
 * Context Mapper for Vendor Management ↔ Infrastructure Services
 *
 * Translates between Vendor Management domain concepts and Infrastructure domain concepts
 * for file management, database operations, and messaging
 */
@Injectable()
export class VendorInfrastructureContextMapper extends BaseContextMapper {
	constructor() {
		super('VendorInfrastructureContextMapper');
	}

	getDomain(): string {
		return 'marketplace';
	}

	getTargetDomain(): string {
		return 'infrastructure';
	}

	validateSourceData(data: any): boolean {
		if (data.file) {
			return this.validateFileData(data.file);
		}
		if (data.vendorData) {
			return this.validateVendorData(data.vendorData);
		}
		return true;
	}

	validateTargetData(data: any): boolean {
		return this.validateInfrastructureResponse(data);
	}

	// ============================================================================
	// Marketplace → Infrastructure Translation
	// ============================================================================

	/**
	 * Translate marketplace vendor file upload to infrastructure format
	 */
	toInfrastructureVendorFileUpload(vendorId: string, file: {
		filename: string;
		buffer: Buffer;
		mimeType: string;
		context: string;
	}) {
		this.logTranslationStart('toInfrastructureVendorFileUpload', { vendorId, filename: file.filename });

		try {
			if (!this.validateSourceData({ file })) {
				throw this.createValidationError('Invalid vendor file data', { vendorId, file });
			}

			const result = {
				filename: file.filename,
				buffer: file.buffer,
				mimeType: file.mimeType,
				uploadedBy: vendorId,
				context: `vendor_${file.context}`,
				metadata: {
					vendorId,
					uploadType: 'vendor_asset',
					timestamp: new Date().toISOString(),
				},
			};

			this.logTranslationSuccess('toInfrastructureVendorFileUpload', result);
			return result;
		} catch (error) {
			this.logTranslationError('toInfrastructureVendorFileUpload', error, { vendorId, file });
			throw error;
		}
	}

	/**
	 * Translate marketplace vendor data to infrastructure database format
	 */
	toInfrastructureVendorDatabase(vendorData: {
		id: string;
		email: string;
		firstName?: string;
		lastName?: string;
		metadata?: Record<string, any>;
		createdAt: string;
		updatedAt: string;
	}) {
		this.logTranslationStart('toInfrastructureVendorDatabase', { id: vendorData.id });

		try {
			if (!this.validateSourceData({ vendorData })) {
				throw this.createValidationError('Invalid vendor data', { vendorData });
			}

			const result = {
				id: vendorData.id,
				email: vendorData.email,
				firstName: vendorData.firstName || '',
				lastName: vendorData.lastName || '',
				metadata: this.sanitizeMetadata(vendorData.metadata || {}),
				createdAt: vendorData.createdAt,
				updatedAt: vendorData.updatedAt,
				table: 'vendors',
				operation: 'upsert',
			};

			this.logTranslationSuccess('toInfrastructureVendorDatabase', result);
			return result;
		} catch (error) {
			this.logTranslationError('toInfrastructureVendorDatabase', error, { vendorData });
			throw error;
		}
	}

	/**
	 * Translate marketplace vendor event to infrastructure messaging format
	 */
	toInfrastructureVendorEvent(eventType: string, vendorId: string, eventData: Record<string, any>) {
		this.logTranslationStart('toInfrastructureVendorEvent', { eventType, vendorId });

		try {
			const result = {
				eventType: `marketplace.vendor.${eventType}`,
				entityId: vendorId,
				entityType: 'vendor',
				data: this.sanitizeMetadata(eventData),
				timestamp: new Date().toISOString(),
				source: 'marketplace',
				version: '1.0',
			};

			this.logTranslationSuccess('toInfrastructureVendorEvent', result);
			return result;
		} catch (error) {
			this.logTranslationError('toInfrastructureVendorEvent', error, { eventType, vendorId, eventData });
			throw error;
		}
	}

	// ============================================================================
	// Infrastructure → Marketplace Translation
	// ============================================================================

	/**
	 * Translate infrastructure file response to marketplace format
	 */
	toMarketplaceVendorFile(fileResponse: {
		id: string;
		filename: string;
		url: string;
		mimeType: string;
		size: number;
		uploadedBy: string;
		context: string;
		createdAt: string;
	}) {
		this.logTranslationStart('toMarketplaceVendorFile', { id: fileResponse.id });

		try {
			if (!this.validateTargetData(fileResponse)) {
				throw this.createValidationError('Invalid infrastructure file response', { fileResponse });
			}

			const result = {
				fileId: fileResponse.id,
				filename: fileResponse.filename,
				url: fileResponse.url,
				mimeType: fileResponse.mimeType,
				size: fileResponse.size,
				vendorId: fileResponse.uploadedBy,
				context: fileResponse.context.replace('vendor_', ''),
				uploadedAt: fileResponse.createdAt,
			};

			this.logTranslationSuccess('toMarketplaceVendorFile', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorFile', error, { fileResponse });
			throw error;
		}
	}

	/**
	 * Translate infrastructure database response to marketplace format
	 */
	toMarketplaceVendorDatabase(databaseResponse: {
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		metadata: Record<string, any>;
		createdAt: string;
		updatedAt: string;
	}) {
		this.logTranslationStart('toMarketplaceVendorDatabase', { id: databaseResponse.id });

		try {
			if (!this.validateTargetData(databaseResponse)) {
				throw this.createValidationError('Invalid infrastructure database response', { databaseResponse });
			}

			const result = {
				id: databaseResponse.id,
				email: databaseResponse.email,
				firstName: databaseResponse.firstName,
				lastName: databaseResponse.lastName,
				metadata: databaseResponse.metadata,
				createdAt: databaseResponse.createdAt,
				updatedAt: databaseResponse.updatedAt,
			};

			this.logTranslationSuccess('toMarketplaceVendorDatabase', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceVendorDatabase', error, { databaseResponse });
			throw error;
		}
	}

	// ============================================================================
	// Validation Methods
	// ============================================================================

	/**
	 * Validate vendor data
	 */
	private validateVendorData(vendorData: any): boolean {
		const isValid =
			vendorData &&
			typeof vendorData.id === 'string' &&
			vendorData.id.length > 0 &&
			typeof vendorData.email === 'string' &&
			vendorData.email.includes('@');

		if (!isValid) {
			this.logger.warn('Invalid vendor data', { vendorData });
		}

		return isValid;
	}

	/**
	 * Validate infrastructure response data
	 */
	private validateInfrastructureResponse(data: any): boolean {
		const isValid =
			data &&
			typeof data.id === 'string' &&
			data.id.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid infrastructure response data', { data });
		}

		return isValid;
	}
} 