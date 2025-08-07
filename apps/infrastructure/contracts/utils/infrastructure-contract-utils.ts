import { Logger } from '@nestjs/common';

/**
 * Infrastructure Contract Utilities
 * 
 * Domain-specific utilities for infrastructure contract operations.
 * Contains validation and transformation logic specific to the infrastructure domain.
 */
export class InfrastructureContractUtils {
	private static logger = new Logger('InfrastructureContractUtils');

	// ============================================================================
	// File Data Validation
	// ============================================================================

	/**
	 * Validate file data for infrastructure services
	 */
	static validateFileData(file: {
		filename: string;
		buffer: Buffer;
		mimeType: string;
		uploadedBy: string;
		context: string;
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
			typeof file.context === 'string' &&
			file.context.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid file data for infrastructure services', { file });
		}

		return isValid;
	}

	/**
	 * Validate file upload result for infrastructure services
	 */
	static validateFileUploadResult(result: {
		fileId: string;
		url: string;
		size: number;
		mimeType: string;
		uploadedAt: string;
	}): boolean {
		const isValid =
			result &&
			typeof result.fileId === 'string' &&
			result.fileId.length > 0 &&
			typeof result.url === 'string' &&
			result.url.length > 0 &&
			typeof result.size === 'number' &&
			result.size > 0 &&
			typeof result.mimeType === 'string' &&
			result.mimeType.length > 0 &&
			typeof result.uploadedAt === 'string' &&
			result.uploadedAt.length > 0;

		if (!isValid) {
			this.logger.warn('Invalid file upload result for infrastructure services', { result });
		}

		return isValid;
	}

	// ============================================================================
	// Database Data Validation
	// ============================================================================

	/**
	 * Validate database operation request for infrastructure services
	 */
	static validateDatabaseRequest(request: {
		operation: string;
		table: string;
		data: any;
		conditions?: Record<string, any>;
	}): boolean {
		const isValid =
			request &&
			typeof request.operation === 'string' &&
			['select', 'insert', 'update', 'delete'].includes(request.operation.toLowerCase()) &&
			typeof request.table === 'string' &&
			request.table.length > 0 &&
			request.data &&
			(!request.conditions || typeof request.conditions === 'object');

		if (!isValid) {
			this.logger.warn('Invalid database request for infrastructure services', { request });
		}

		return isValid;
	}

	/**
	 * Validate database operation result for infrastructure services
	 */
	static validateDatabaseResult(result: {
		success: boolean;
		data?: any;
		affectedRows?: number;
		error?: string;
	}): boolean {
		const isValid =
			result &&
			typeof result.success === 'boolean' &&
			(result.data === undefined || result.data !== null) &&
			(result.affectedRows === undefined || typeof result.affectedRows === 'number') &&
			(result.error === undefined || typeof result.error === 'string');

		if (!isValid) {
			this.logger.warn('Invalid database result for infrastructure services', { result });
		}

		return isValid;
	}

	// ============================================================================
	// Gateway Data Validation
	// ============================================================================

	/**
	 * Validate gateway request for infrastructure services
	 */
	static validateGatewayRequest(request: {
		method: string;
		path: string;
		headers?: Record<string, string>;
		body?: any;
	}): boolean {
		const isValid =
			request &&
			typeof request.method === 'string' &&
			['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method.toUpperCase()) &&
			typeof request.path === 'string' &&
			request.path.length > 0 &&
			(!request.headers || typeof request.headers === 'object') &&
			(request.body === undefined || request.body !== null);

		if (!isValid) {
			this.logger.warn('Invalid gateway request for infrastructure services', { request });
		}

		return isValid;
	}

	/**
	 * Validate gateway response for infrastructure services
	 */
	static validateGatewayResponse(response: {
		statusCode: number;
		headers?: Record<string, string>;
		body?: any;
	}): boolean {
		const isValid =
			response &&
			typeof response.statusCode === 'number' &&
			response.statusCode >= 100 &&
			response.statusCode < 600 &&
			(!response.headers || typeof response.headers === 'object') &&
			(response.body === undefined || response.body !== null);

		if (!isValid) {
			this.logger.warn('Invalid gateway response for infrastructure services', { response });
		}

		return isValid;
	}

	// ============================================================================
	// Infrastructure Data Transformation
	// ============================================================================

	/**
	 * Transform file upload request to infrastructure format
	 */
	static transformFileUploadRequest(fileData: {
		filename: string;
		buffer: Buffer;
		mimeType: string;
		uploadedBy: string;
		context: string;
	}) {
		return {
			originalName: fileData.filename,
			buffer: fileData.buffer,
			mimetype: fileData.mimeType,
			uploadedBy: fileData.uploadedBy,
			context: fileData.context,
			uploadedAt: new Date().toISOString(),
		};
	}

	/**
	 * Transform database request to infrastructure format
	 */
	static transformDatabaseRequest(request: {
		operation: string;
		table: string;
		data: any;
		conditions?: Record<string, any>;
	}) {
		return {
			query: request.operation.toLowerCase(),
			table: request.table,
			values: request.data,
			where: request.conditions || {},
			timestamp: new Date().toISOString(),
		};
	}
} 