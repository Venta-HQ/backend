// Validation utilities
import { validateFileUpload, validateUploadOptions } from '../schemas/validation.utils';
import { CloudinaryUploadOptions, FileUpload, FileUploadResult } from '../types/domain/file.types';

/**
 * File Management ACL
 * Handles validation and transformation for file upload/management operations
 */

/**
 * File Upload ACL
 * Validates and transforms file upload requests
 */
export class FileUploadACL {
	// HTTP → Domain (inbound)
	static validate(file: any): void {
		validateFileUpload(file);
	}

	static toDomain(file: any): FileUpload {
		return validateFileUpload(file);
	}

	// Domain → gRPC (outbound for API Gateway)
	static toGrpc(domain: FileUpload, context: { type: any; uploadedBy: string }) {
		return {
			content: domain.buffer,
			filename: domain.filename,
			mimetype: domain.mimetype,
			size: domain.size,
			uploadedBy: context.uploadedBy,
			type: context.type,
		};
	}

	// gRPC → Domain (inbound for API Gateway)
	static fromGrpc(grpcResult: any): FileUploadResult {
		return {
			url: grpcResult.url || '',
			publicId: grpcResult.fileId || '',
			format: 'unknown', // Not provided in gRPC response
			bytes: 0, // Not provided in gRPC response
			createdAt: grpcResult.uploadedAt || new Date().toISOString(),
		};
	}
}

/**
 * Cloudinary Upload Options ACL
 * Validates and transforms Cloudinary upload configuration
 */
export class CloudinaryOptionsACL {
	// HTTP → Domain (inbound)
	static validate(options: any): void {
		validateUploadOptions(options);
	}

	static toDomain(options: any = {}): CloudinaryUploadOptions {
		const validatedOptions = validateUploadOptions(options);

		return {
			folder: validatedOptions.folder,
			transformation: validatedOptions.transformation,
			tags: Array.isArray(validatedOptions.tags) ? validatedOptions.tags : undefined,
			context:
				validatedOptions.context && typeof validatedOptions.context === 'object' ? validatedOptions.context : undefined,
		};
	}
}
