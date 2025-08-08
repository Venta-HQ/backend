import { AppError, ErrorCodes } from '@app/nest/errors';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { Infrastructure } from '@domains/infrastructure/contracts/types/context-mapping.types';
import { Controller, Logger, UsePipes } from '@nestjs/common';
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
	@UsePipes(new SchemaValidatorPipe(Infrastructure.Validation.FileUploadSchema))
	async uploadImage(request: Infrastructure.Contracts.FileUpload): Promise<Infrastructure.Core.FileUploadResult> {
		this.logger.debug('Handling image upload request', {
			filename: request.filename,
			size: request.size,
			context: request.context,
		});

		try {
			// Validate file type
			if (!request.mimetype.startsWith('image/')) {
				throw AppError.validation('INVALID_FILE_TYPE', ErrorCodes.INVALID_FILE_TYPE, {
					operation: 'validate_image_upload',
					filename: request.filename,
					mimetype: request.mimetype,
				});
			}

			// Validate file size (5MB)
			if (request.size > 5 * 1024 * 1024) {
				throw AppError.validation('INVALID_FORMAT', ErrorCodes.INVALID_FORMAT, {
					operation: 'validate_image_upload',
					field: 'size',
					filename: request.filename,
					size: request.size,
					maxSize: 5 * 1024 * 1024,
				});
			}

			const result = await this.fileManagementService.uploadFile(request);

			return result;
		} catch (error) {
			this.logger.error('Failed to handle image upload', {
				error: error instanceof Error ? error.message : 'Unknown error',
				filename: request.filename,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal('INFRASTRUCTURE_FILE_UPLOAD_FAILED', ErrorCodes.INFRASTRUCTURE_FILE_UPLOAD_FAILED, {
				operation: 'upload_image',
				filename: request.filename,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
