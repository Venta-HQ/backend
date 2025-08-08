import { AppError, ErrorCodes } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { Infrastructure } from '../types/context-mapping.types';

/**
 * Anti-Corruption Layer for Cloudinary integration
 * Handles validation and transformation of Cloudinary-specific data
 */
@Injectable()
export class CloudinaryACL {
	private readonly logger = new Logger(CloudinaryACL.name);

	/**
	 * Validate file upload request
	 */
	validateFileUpload(data: unknown): data is Infrastructure.Contracts.FileUpload {
		return Infrastructure.Validation.FileUploadSchema.safeParse(data).success;
	}

	/**
	 * Validate Cloudinary upload options
	 */
	validateUploadOptions(data: unknown): data is Infrastructure.Internal.CloudinaryUploadOptions {
		return Infrastructure.Validation.CloudinaryUploadOptionsSchema.safeParse(data).success;
	}

	/**
	 * Convert domain file upload to Cloudinary options
	 */
	toCloudinaryOptions(upload: Infrastructure.Contracts.FileUpload): Infrastructure.Internal.CloudinaryUploadOptions {
		const resourceType = this.getResourceType(upload.mimetype);
		const folder = this.getFolderFromContext(upload.context);

		return {
			resourceType,
			folder,
			publicId: this.generatePublicId(upload),
		};
	}

	/**
	 * Convert Cloudinary response to domain file upload result
	 */
	toDomainResult(response: Record<string, unknown>): Infrastructure.Core.FileUploadResult {
		try {
			if (!this.isValidCloudinaryResponse(response)) {
				throw new Error('Invalid Cloudinary response structure');
			}

			return {
				fileId: response.public_id,
				url: response.secure_url,
				filename: response.original_filename,
				size: response.bytes,
				mimetype: response.format ? `image/${response.format}` : response.resource_type,
				timestamp: new Date(response.created_at * 1000).toISOString(),
				uploadedBy: response.uploadedBy || 'system',
				context: response.context || 'default',
				provider: 'cloudinary',
			};
		} catch (error) {
			this.logger.error('Failed to convert Cloudinary response', { error });
			throw AppError.externalService('UPLOAD_FAILED', 'Failed to process upload response');
		}
	}

	/**
	 * Get resource type from MIME type
	 */
	private getResourceType(mimetype: string): Infrastructure.Internal.CloudinaryUploadOptions['resourceType'] {
		if (mimetype.startsWith('image/')) return 'image';
		if (mimetype.startsWith('video/')) return 'video';
		return 'raw';
	}

	/**
	 * Get folder name from upload context
	 */
	private getFolderFromContext(context: string): string {
		const contextMap: Record<string, string> = {
			user_profile: 'users',
			vendor_logo: 'vendors',
			product_image: 'products',
		};

		return contextMap[context] || 'misc';
	}

	/**
	 * Generate a unique public ID for the file
	 */
	private generatePublicId(upload: Infrastructure.Contracts.FileUpload): string {
		const timestamp = Date.now();
		const randomSuffix = Math.random().toString(36).substring(2, 8);
		const extension = upload.filename.split('.').pop() || '';

		return `${upload.context}_${timestamp}_${randomSuffix}.${extension}`;
	}

	/**
	 * Type guard for Cloudinary response
	 */
	private isValidCloudinaryResponse(response: Record<string, unknown>): response is {
		public_id: string;
		secure_url: string;
		original_filename: string;
		bytes: number;
		format?: string;
		resource_type: string;
		created_at: number;
		uploadedBy?: string;
		context?: string;
	} {
		return (
			typeof response.public_id === 'string' &&
			typeof response.secure_url === 'string' &&
			typeof response.original_filename === 'string' &&
			typeof response.bytes === 'number' &&
			typeof response.resource_type === 'string' &&
			typeof response.created_at === 'number'
		);
	}
}
