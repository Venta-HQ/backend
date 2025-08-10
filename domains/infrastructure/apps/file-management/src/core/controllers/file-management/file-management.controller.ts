import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FileUploadACL } from '@venta/domains/infrastructure/contracts';
import type { FileUpload, FileUploadResult } from '@venta/domains/infrastructure/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { FileManagementService } from '../../../core/services/file-management/file-management.service';

/**
 * gRPC controller for file management operations
 */
@Controller()
export class FileManagementController {
	private readonly logger = new Logger(FileManagementController.name);

	constructor(private readonly fileManagementService: FileManagementService) {}

	@GrpcMethod('FileManagementService', 'UploadImage')
	async uploadImage(request: FileUpload): Promise<FileUploadResult> {
		// Transform gRPC input to domain using ACL
		const domainRequest = FileUploadACL.toDomain(request);

		this.logger.debug('Handling image upload request', {
			filename: domainRequest.filename,
			size: domainRequest.size,
			mimetype: domainRequest.mimetype,
		});

		try {
			// Validate file type
			if (!domainRequest.mimetype.startsWith('image/')) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field: 'mimetype',
					filename: domainRequest.filename,
					mimetype: domainRequest.mimetype,
				});
			}

			// Validate file size (5MB)
			if (domainRequest.size > 5 * 1024 * 1024) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					message: 'File size exceeds maximum allowed (5MB)',
					field: 'size',
					filename: domainRequest.filename,
					size: domainRequest.size,
					maxSize: 5 * 1024 * 1024,
				});
			}

			const result = await this.fileManagementService.uploadFile(domainRequest);

			return result;
		} catch (error) {
			this.logger.error('Failed to handle image upload', {
				error: error instanceof Error ? error.message : 'Unknown error',
				filename: request.filename,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_FILE_OPERATION_FAILED, {
				operation: 'delete',
				filename: request.filename,
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
