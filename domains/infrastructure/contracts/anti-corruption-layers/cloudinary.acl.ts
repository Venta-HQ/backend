import { AppError, ErrorCodes } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryUploadOptionsSchema, FileUploadSchema } from '../schemas/file/file.schemas';
import { CloudinaryUploadOptions, FileUpload, FileUploadResult } from '../types/file/file.types';

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
	validateFileUpload(data: unknown): data is FileUpload {
		const result = FileUploadSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INFRA_UPLOAD_FAILED, {
				operation: 'validate_file_upload',
				errors: result.error.errors,
				filename: (data as any)?.filename || 'undefined',
			});
		}
		return true;
	}

	/**
	 * Validate Cloudinary upload options
	 */
	validateUploadOptions(data: unknown): data is CloudinaryUploadOptions {
		const result = CloudinaryUploadOptionsSchema.safeParse(data);
		if (!result.success) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
				operation: 'validate_upload_options',
				errors: result.error.errors,
				field: 'options',
			});
		}
		return true;
	}

	/**
	 * Convert domain file upload to Cloudinary options
	 */
	toCloudinaryOptions(upload: FileUpload): CloudinaryUploadOptions {
		if (!upload?.mimetype || !upload?.context || !upload?.filename) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_REQUIRED_FIELD, {
				operation: 'to_cloudinary_options',
				field: !upload?.mimetype ? 'mimetype' : !upload?.context ? 'context' : 'filename',
			});
		}

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
	toDomainResult(response: Record<string, unknown>): FileUploadResult {
		try {
			if (!this.isValidCloudinaryResponse(response)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
					operation: 'to_domain_result',
					field: 'response',
				});
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
			this.logger.error('Failed to convert Cloudinary response', {
				error: error instanceof Error ? error.message : 'Unknown error',
				response,
			});

			if (error instanceof AppError) throw error;
			throw AppError.externalService(ErrorCodes.ERR_SERVICE_UNAVAILABLE, {
				operation: 'to_domain_result',
				service: 'cloudinary',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	/**
	 * Get resource type from MIME type
	 */
	private getResourceType(mimetype: string): CloudinaryUploadOptions['resourceType'] {
		if (!mimetype) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_REQUIRED_FIELD, {
				operation: 'get_resource_type',
				field: 'mimetype',
			});
		}

		if (mimetype.startsWith('image/')) return 'image';
		if (mimetype.startsWith('video/')) return 'video';
		return 'raw';
	}

	/**
	 * Get folder name from upload context
	 */
	private getFolderFromContext(context: string): string {
		if (!context) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_REQUIRED_FIELD, {
				operation: 'get_folder_from_context',
				field: 'context',
			});
		}

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
	private generatePublicId(upload: FileUpload): string {
		if (!upload?.filename || !upload?.context) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_REQUIRED_FIELD, {
				operation: 'generate_public_id',
				field: !upload?.filename ? 'filename' : 'context',
			});
		}

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
		const requiredFields = ['public_id', 'secure_url', 'original_filename', 'bytes', 'resource_type', 'created_at'];

		const missingFields = requiredFields.filter((field) => !response[field]);
		if (missingFields.length > 0) {
			throw AppError.validation(ErrorCodes.ERR_MISSING_REQUIRED_FIELD, {
				operation: 'validate_cloudinary_response',
				field: missingFields[0],
				response,
			});
		}

		const invalidTypes = requiredFields.filter((field) => {
			const value = response[field];
			switch (field) {
				case 'public_id':
				case 'secure_url':
				case 'original_filename':
				case 'resource_type':
					return typeof value !== 'string';
				case 'bytes':
				case 'created_at':
					return typeof value !== 'number';
				default:
					return false;
			}
		});

		if (invalidTypes.length > 0) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
				operation: 'validate_cloudinary_response',
				field: invalidTypes[0],
				response,
			});
		}

		return true;
	}
}
