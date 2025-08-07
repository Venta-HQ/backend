import { Injectable } from '@nestjs/common';
import { BaseContextMapper } from '@app/nest/modules/contracts';

/**
 * Infrastructure → Marketplace Context Mapper
 * 
 * Translates data between Infrastructure and Marketplace domains
 */
@Injectable()
export class InfrastructureMarketplaceContextMapper extends BaseContextMapper {
	constructor() {
		super('InfrastructureMarketplaceContextMapper');
	}

	getDomain(): string {
		return 'infrastructure';
	}

	getTargetDomain(): string {
		return 'marketplace';
	}

	/**
	 * Translate infrastructure file upload result to marketplace format
	 */
	toMarketplaceFileUploadResult(
		uploadResult: {
			fileId: string;
			url: string;
			size: number;
			mimeType: string;
			metadata?: Record<string, any>;
		},
	) {
		this.logTranslationStart('toMarketplaceFileUploadResult', { fileId: uploadResult.fileId });

		try {
			// Validate source data
			this.validateSourceData(uploadResult);

			// Transform to marketplace format
			const marketplaceFile = {
				id: uploadResult.fileId,
				url: uploadResult.url,
				size: uploadResult.size,
				type: uploadResult.mimeType,
				metadata: uploadResult.metadata || {},
				uploadedAt: new Date().toISOString(),
			};

			// Validate target data
			this.validateTargetData(marketplaceFile);

			this.logTranslationSuccess('toMarketplaceFileUploadResult', { fileId: uploadResult.fileId });
			return marketplaceFile;
		} catch (error) {
			this.logTranslationError('toMarketplaceFileUploadResult', error, { fileId: uploadResult.fileId });
			throw error;
		}
	}

	/**
	 * Translate marketplace file upload request to infrastructure format
	 */
	toInfrastructureFileUploadRequest(
		uploadRequest: {
			file: Buffer;
			filename: string;
			mimeType: string;
			folder?: string;
			metadata?: Record<string, any>;
		},
	) {
		this.logTranslationStart('toInfrastructureFileUploadRequest', { filename: uploadRequest.filename });

		try {
			// Validate source data
			this.validateSourceData(uploadRequest);

			// Transform to infrastructure format
			const infrastructureRequest = {
				content: uploadRequest.file,
				name: uploadRequest.filename,
				type: uploadRequest.mimeType,
				path: uploadRequest.folder || 'uploads',
				tags: uploadRequest.metadata || {},
				uploadedAt: new Date().toISOString(),
			};

			// Validate target data
			this.validateTargetData(infrastructureRequest);

			this.logTranslationSuccess('toInfrastructureFileUploadRequest', { filename: uploadRequest.filename });
			return infrastructureRequest;
		} catch (error) {
			this.logTranslationError('toInfrastructureFileUploadRequest', error, { filename: uploadRequest.filename });
			throw error;
		}
	}

	/**
	 * Translate infrastructure database operation result to marketplace format
	 */
	toMarketplaceDatabaseResult(
		databaseResult: {
			operation: string;
			affectedRows: number;
			executionTime: number;
			success: boolean;
			error?: string;
		},
	) {
		this.logTranslationStart('toMarketplaceDatabaseResult', { operation: databaseResult.operation, success: databaseResult.success });

		try {
			// Validate source data
			this.validateSourceData(databaseResult);

			// Transform to marketplace format
			const marketplaceResult = {
				operation: databaseResult.operation,
				rowsAffected: databaseResult.affectedRows,
				duration: databaseResult.executionTime,
				success: databaseResult.success,
				error: databaseResult.error || null,
				completedAt: new Date().toISOString(),
			};

			// Validate target data
			this.validateTargetData(marketplaceResult);

			this.logTranslationSuccess('toMarketplaceDatabaseResult', { operation: databaseResult.operation });
			return marketplaceResult;
		} catch (error) {
			this.logTranslationError('toMarketplaceDatabaseResult', error, { operation: databaseResult.operation });
			throw error;
		}
	}

	/**
	 * Translate marketplace database request to infrastructure format
	 */
	toInfrastructureDatabaseRequest(
		databaseRequest: {
			query: string;
			params?: any[];
			timeout?: number;
			transaction?: boolean;
		},
	) {
		this.logTranslationStart('toInfrastructureDatabaseRequest', { query: databaseRequest.query.substring(0, 50) + '...' });

		try {
			// Validate source data
			this.validateSourceData(databaseRequest);

			// Transform to infrastructure format
			const infrastructureRequest = {
				sql: databaseRequest.query,
				parameters: databaseRequest.params || [],
				maxExecutionTime: databaseRequest.timeout || 30000,
				useTransaction: databaseRequest.transaction || false,
				requestedAt: new Date().toISOString(),
			};

			// Validate target data
			this.validateTargetData(infrastructureRequest);

			this.logTranslationSuccess('toInfrastructureDatabaseRequest', { query: databaseRequest.query.substring(0, 50) + '...' });
			return infrastructureRequest;
		} catch (error) {
			this.logTranslationError('toInfrastructureDatabaseRequest', error, { query: databaseRequest.query.substring(0, 50) + '...' });
			throw error;
		}
	}

	/**
	 * Translate infrastructure gateway routing result to marketplace format
	 */
	toMarketplaceGatewayResult(
		gatewayResult: {
			route: string;
			statusCode: number;
			responseTime: number;
			success: boolean;
			error?: string;
		},
	) {
		this.logTranslationStart('toMarketplaceGatewayResult', { route: gatewayResult.route, statusCode: gatewayResult.statusCode });

		try {
			// Validate source data
			this.validateSourceData(gatewayResult);

			// Transform to marketplace format
			const marketplaceResult = {
				endpoint: gatewayResult.route,
				status: gatewayResult.statusCode,
				responseTime: gatewayResult.responseTime,
				success: gatewayResult.success,
				error: gatewayResult.error || null,
				processedAt: new Date().toISOString(),
			};

			// Validate target data
			this.validateTargetData(marketplaceResult);

			this.logTranslationSuccess('toMarketplaceGatewayResult', { route: gatewayResult.route });
			return marketplaceResult;
		} catch (error) {
			this.logTranslationError('toMarketplaceGatewayResult', error, { route: gatewayResult.route });
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
		if (data.fileId && typeof data.fileId !== 'string') {
			throw this.createValidationError('Invalid file ID format', { data });
		}

		return true;
	}

	validateTargetData(data: any): boolean {
		if (!data) {
			throw this.createValidationError('Target data is required', { data });
		}

		// Additional validation based on data structure
		if (data.id && typeof data.id !== 'string') {
			throw this.createValidationError('Invalid ID format', { data });
		}

		return true;
	}
} 