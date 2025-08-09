import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Infrastructure } from '@venta/domains/infrastructure/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import { FileManagementService } from '../../../core/services/file-management/file-management.service';

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
					field: 'mimetype',
					filename: request.filename,
					mimetype: request.mimetype,
				});
			}

			// Validate file size (5MB)
			if (request.size > 5 * 1024 * 1024) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					message: 'File size exceeds maximum allowed (5MB)',
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

			throw AppError.internal(ErrorCodes.ERR_INFRA_UPLOAD_FAILED, {
				filename: request.filename,
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
