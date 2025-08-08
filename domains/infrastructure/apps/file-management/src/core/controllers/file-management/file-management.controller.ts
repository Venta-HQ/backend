import { AppError, ErrorCodes } from '@app/nest/errors';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { Infrastructure } from '@domains/infrastructure/contracts/types/context-mapping.types';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FileManagementService } from '../../services/file-management/file-management.service';

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
				throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
					operation: 'validate_image_upload',
					filename: request.filename,
					mimetype: request.mimetype,
					message: 'Only image files are allowed',
				});
			}

			// Validate file size (5MB)
			if (request.size > 5 * 1024 * 1024) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
					operation: 'validate_image_upload',
					field: 'size',
					filename: request.filename,
					size: request.size,
					maxSize: 5 * 1024 * 1024,
					message: 'File size exceeds maximum allowed (5MB)',
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

			throw AppError.internal(ErrorCodes.ERR_UPLOAD, {
				operation: 'upload_image',
				filename: request.filename,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
