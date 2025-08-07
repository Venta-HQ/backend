import { ValidationUtils } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Infrastructure → Marketplace Context Mapper
 *
 * Translates data between Infrastructure and Marketplace domains
 */
@Injectable()
export class InfrastructureMarketplaceContextMapper {
	private readonly logger = new Logger('InfrastructureMarketplaceContextMapper');

	/**
	 * Validate file upload result
	 */
	private validateFileUploadResult(data: any): boolean {
		return (
			data &&
			typeof data.fileId === 'string' &&
			typeof data.url === 'string' &&
			typeof data.size === 'number' &&
			typeof data.mimeType === 'string'
		);
	}

	/**
	 * Validate file upload request
	 */
	private validateFileUploadRequest(data: any): boolean {
		return (
			data && data.file instanceof Buffer && typeof data.filename === 'string' && typeof data.mimeType === 'string'
		);
	}

	/**
	 * Validate database result
	 */
	private validateDatabaseResult(data: any): boolean {
		return (
			data &&
			typeof data.operation === 'string' &&
			typeof data.affectedRows === 'number' &&
			typeof data.executionTime === 'number' &&
			typeof data.success === 'boolean'
		);
	}

	/**
	 * Validate database request
	 */
	private validateDatabaseRequest(data: any): boolean {
		return data && typeof data.query === 'string';
	}

	/**
	 * Validate gateway result
	 */
	private validateGatewayResult(data: any): boolean {
		return (
			data &&
			typeof data.route === 'string' &&
			typeof data.statusCode === 'number' &&
			typeof data.responseTime === 'number' &&
			typeof data.success === 'boolean'
		);
	}

	/**
	 * Translate infrastructure file upload result to marketplace format
	 */
	toMarketplaceFileUploadResult(uploadResult: {
		fileId: string;
		url: string;
		size: number;
		mimeType: string;
		metadata?: Record<string, any>;
	}) {
		try {
			// Validate source data
			if (!this.validateFileUploadResult(uploadResult)) {
				throw new Error('Invalid file upload result data');
			}

			// Transform to marketplace format
			const marketplaceFile = {
				id: uploadResult.fileId,
				url: uploadResult.url,
				size: uploadResult.size,
				type: uploadResult.mimeType,
				metadata: uploadResult.metadata || {},
				uploadedAt: new Date().toISOString(),
			};

			return marketplaceFile;
		} catch (error) {
			this.logger.error('Failed to translate file upload result', error);
			throw error;
		}
	}

	/**
	 * Translate marketplace file upload request to infrastructure format
	 */
	toInfrastructureFileUploadRequest(uploadRequest: {
		file: Buffer;
		filename: string;
		mimeType: string;
		folder?: string;
		metadata?: Record<string, any>;
	}) {
		try {
			// Validate source data
			if (!this.validateFileUploadRequest(uploadRequest)) {
				throw new Error('Invalid file upload request data');
			}

			// Transform to infrastructure format
			const infrastructureRequest = {
				content: uploadRequest.file,
				name: uploadRequest.filename,
				type: uploadRequest.mimeType,
				path: uploadRequest.folder || 'uploads',
				tags: uploadRequest.metadata || {},
				uploadedAt: new Date().toISOString(),
			};

			return infrastructureRequest;
		} catch (error) {
			this.logger.error('Failed to translate file upload request', error);
			throw error;
		}
	}

	/**
	 * Translate infrastructure database operation result to marketplace format
	 */
	toMarketplaceDatabaseResult(databaseResult: {
		operation: string;
		affectedRows: number;
		executionTime: number;
		success: boolean;
		error?: string;
	}) {
		try {
			// Validate source data
			if (!this.validateDatabaseResult(databaseResult)) {
				throw new Error('Invalid database result data');
			}

			// Transform to marketplace format
			const marketplaceResult = {
				operation: databaseResult.operation,
				rowsAffected: databaseResult.affectedRows,
				duration: databaseResult.executionTime,
				success: databaseResult.success,
				error: databaseResult.error || null,
				completedAt: new Date().toISOString(),
			};

			return marketplaceResult;
		} catch (error) {
			this.logger.error('Failed to translate database result', error);
			throw error;
		}
	}

	/**
	 * Translate marketplace database request to infrastructure format
	 */
	toInfrastructureDatabaseRequest(databaseRequest: {
		query: string;
		params?: any[];
		timeout?: number;
		transaction?: boolean;
	}) {
		try {
			// Validate source data
			if (!this.validateDatabaseRequest(databaseRequest)) {
				throw new Error('Invalid database request data');
			}

			// Transform to infrastructure format
			const infrastructureRequest = {
				sql: databaseRequest.query,
				parameters: databaseRequest.params || [],
				maxExecutionTime: databaseRequest.timeout || 30000,
				useTransaction: databaseRequest.transaction || false,
				requestedAt: new Date().toISOString(),
			};

			return infrastructureRequest;
		} catch (error) {
			this.logger.error('Failed to translate database request', error);
			throw error;
		}
	}

	/**
	 * Translate infrastructure gateway routing result to marketplace format
	 */
	toMarketplaceGatewayResult(gatewayResult: {
		route: string;
		statusCode: number;
		responseTime: number;
		success: boolean;
		error?: string;
	}) {
		try {
			// Validate source data
			if (!this.validateGatewayResult(gatewayResult)) {
				throw new Error('Invalid gateway result data');
			}

			// Transform to marketplace format
			const marketplaceResult = {
				endpoint: gatewayResult.route,
				status: gatewayResult.statusCode,
				responseTime: gatewayResult.responseTime,
				success: gatewayResult.success,
				error: gatewayResult.error || null,
				processedAt: new Date().toISOString(),
			};

			return marketplaceResult;
		} catch (error) {
			this.logger.error('Failed to translate gateway result', error);
			throw error;
		}
	}


}
