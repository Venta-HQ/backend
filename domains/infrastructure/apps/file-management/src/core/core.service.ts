import { Injectable } from '@nestjs/common';
import { CloudinaryOptionsACL } from '@venta/domains/infrastructure/contracts';
import type { FileUpload, FileUploadResult } from '@venta/domains/infrastructure/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { CloudinaryService, Logger } from '@venta/nest/modules';

/**
 * Core service for file management operations
 */
@Injectable()
export class CoreService {
	constructor(
		private readonly cloudinaryService: CloudinaryService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(CoreService.name);
	}

	async uploadFile(request: FileUpload): Promise<FileUploadResult> {
		this.logger.debug('Processing file upload request', {
			filename: request.filename,
			size: request.size,
			mimetype: request.mimetype,
		});

		try {
			// Convert to Cloudinary options using ACL
			const options = CloudinaryOptionsACL.toDomain({
				folder: 'uploads',
				transformation: 'auto',
			});

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

			const uploadResult: FileUploadResult = {
				url: result.secure_url || result.url,
				publicId: result.public_id,
				format: result.format ?? 'unknown',
				bytes: result.bytes ?? request.size,
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
