import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import {
	FileManagementServiceController,
	FileUploadResponse,
	INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME,
	UploadImageRequest,
} from '@app/proto/infrastructure/file-management';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FileManagementService } from './file-management.service';

/**
 * gRPC controller for file management service
 * Implements the service interface generated from proto/infrastructure/file-management.proto
 */
@Controller()
export class FileManagementController implements FileManagementServiceController {
	private readonly logger = new Logger(FileManagementController.name);

	constructor(private readonly fileManagementService: FileManagementService) {}

	@GrpcMethod(INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME, 'uploadImage')
	async uploadImage(request: UploadImageRequest): Promise<FileUploadResponse> {
		this.logger.debug('Handling image upload request', {
			filename: request.filename,
			size: request.size,
			uploadedBy: request.uploadedBy,
		});

		try {
			if (!request.content) {
				throw AppError.validation('INVALID_INPUT', 'No file content provided', {
					domain: 'infrastructure',
					operation: 'upload_image',
				});
			}

			if (!request.mimetype.startsWith('image/')) {
				throw AppError.validation('INVALID_FILE_TYPE', 'Only image files are allowed', {
					domain: 'infrastructure',
					operation: 'upload_image',
					providedType: request.mimetype,
					allowedTypes: ['image/*'],
				});
			}

			const result = await this.fileManagementService.uploadFile({
				buffer: request.content,
				mimetype: request.mimetype,
				originalname: request.filename,
				size: request.size,
				uploadedBy: request.uploadedBy,
			});

			return {
				url: result.url,
				publicId: result.publicId,
				format: result.format,
				width: result.width,
				height: result.height,
				bytes: result.bytes,
			};
		} catch (error) {
			this.logger.error('Failed to upload image', {
				error: error.message,
				filename: request.filename,
			});

			if (error instanceof AppError) throw error;

			// Convert Cloudinary errors to domain errors
			if (error.message?.includes('File size too large')) {
				throw AppError.validation('FILE_TOO_LARGE', 'File exceeds size limit', {
					domain: 'infrastructure',
					operation: 'upload_image',
					fileSize: request.size,
					maxSize: process.env.MAX_FILE_SIZE || '5MB',
				});
			}

			// Generic upload error with context
			throw AppError.internal('UPLOAD_FAILED', 'Failed to upload file', {
				domain: 'infrastructure',
				operation: 'upload_image',
				error: error.message,
				filename: request.filename,
			});
		}
	}
}
