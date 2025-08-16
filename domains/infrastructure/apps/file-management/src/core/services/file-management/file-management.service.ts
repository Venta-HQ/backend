import { Injectable } from '@nestjs/common';
import { CloudinaryOptionsACL } from '@venta/domains/infrastructure/contracts';
import type {
	CloudinaryUploadOptions,
	FileUpload,
	FileUploadResult,
} from '@venta/domains/infrastructure/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { CloudinaryService, Logger } from '@venta/nest/modules';

/**
 * File management service for infrastructure domain
 */
@Injectable()
export class FileManagementService {
	constructor(
		private readonly cloudinaryService: CloudinaryService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(FileManagementService.name);
	}

	/**
	 * Upload a file to cloud storage
	 */
	async uploadFile(request: FileUpload): Promise<FileUploadResult> {
		this.logger.debug('Processing file upload request', {
			filename: request.filename,
			size: request.size,
			mimetype: request.mimetype,
		});

		try {
			// Validate request using ACL (validation is done automatically in toDomain)
			// The request should already be validated by the calling controller using FileUploadACL

			// Convert to Cloudinary options using ACL
			let options: CloudinaryUploadOptions;
			try {
				// Use default options - the FileUpload interface doesn't include context
				// Options should be passed separately if needed
				options = CloudinaryOptionsACL.toDomain({
					folder: 'uploads',
					transformation: 'auto',
				});
			} catch (error) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field: 'options',
					operation: 'convert_cloudinary_options',
					filename: request.filename,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}

			// Upload file
			let result: any;
			try {
				result = await this.cloudinaryService.uploadBuffer(request.buffer, options);
			} catch (error) {
				throw AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE_ERROR, {
					operation: 'upload_to_cloudinary',
					filename: request.filename,
					service: 'cloudinary',
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}

			// Convert response to domain format
			const uploadResult: FileUploadResult = {
				url: result.secure_url || result.url,
				publicId: result.public_id,
				format: result.format,
				bytes: result.bytes,
				createdAt: result.created_at || new Date().toISOString(),
			};

			this.logger.debug('File upload completed', {
				publicId: uploadResult.publicId,
				url: uploadResult.url,
				format: uploadResult.format,
				bytes: uploadResult.bytes,
			});

			return uploadResult;
		} catch (error) {
			this.logger.error('Failed to upload file', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				filename: request.filename,
				size: request.size,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_FILE_OPERATION_FAILED, {
				operation: 'upload_file',
				filename: request.filename,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
