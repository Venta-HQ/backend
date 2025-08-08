import { AppError, ErrorCodes } from '@app/nest/errors';
import { Infrastructure } from '@domains/infrastructure/contracts/types/context-mapping.types';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FileManagementService } from './file-management.service';

/**
 * gRPC controller for file management operations
 */
@Controller()
export class FileManagementController {
	private readonly logger = new Logger(FileManagementController.name);

	constructor(private readonly fileManagementService: FileManagementService) {}

	@GrpcMethod('FileManagementService', 'UploadImage')
	async uploadImage(request: Infrastructure.Contracts.FileUpload): Promise<Infrastructure.Core.FileUploadResult> {
		this.logger.debug('Handling image upload request', {
			filename: request.filename,
			size: request.size,
			context: request.context,
		});

		try {
			// Validate file type
			if (!request.mimetype.startsWith('image/')) {
				throw AppError.validation('INVALID_FILE_TYPE', 'Invalid file type', {
					providedType: request.mimetype,
				});
			}

			// Validate file size (5MB)
			if (request.size > 5 * 1024 * 1024) {
				throw AppError.validation('FILE_TOO_LARGE', 'File size too large', {
					size: request.size,
					maxSize: 5 * 1024 * 1024,
				});
			}

			const result = await this.fileManagementService.uploadFile(request);

			return result;
		} catch (error) {
			this.logger.error('Failed to handle image upload', {
				error: error.message,
				filename: request.filename,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal('UPLOAD_FAILED', 'File upload failed', {
				filename: request.filename,
				error: error.message,
			});
		}
	}
}
