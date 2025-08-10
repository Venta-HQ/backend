import { Controller, Post, UploadedFile } from '@nestjs/common';
import { Infrastructure } from '@venta/domains/infrastructure/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { UploadService } from '../../services/upload/upload.service';

@Controller()
export class UploadController {
	constructor(private uploadService: UploadService) {}

	@Post('image')
	async uploadImage(
		@UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
	): Promise<Infrastructure.Core.FileUploadResult> {
		try {
			if (!file) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field: 'file',
					domain: 'infrastructure',
					operation: 'upload_image',
					message: 'No file provided',
				});
			}

			if (!file.mimetype.startsWith('image/')) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field: 'file.mimetype',
					domain: 'infrastructure',
					operation: 'upload_image',
					providedType: file.mimetype,
					allowedTypes: ['image/*'],
					message: 'Only image files are allowed',
				});
			}

			return await this.uploadService.uploadFile({
				...file,
				uploadedBy: 'system', // TODO: Get from auth context
			});
		} catch (error) {
			// If it's already an AppError, rethrow it
			if (error instanceof AppError) {
				throw error;
			}

			// Convert Cloudinary errors to domain errors
			if (error.message?.includes('File size too large')) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field: 'file.size',
					domain: 'infrastructure',
					operation: 'upload_image',
					fileSize: file?.size,
					maxSize: process.env.MAX_FILE_SIZE || '5MB',
					message: 'File exceeds size limit',
				});
			}

			// Generic upload error with context
			throw AppError.internal(ErrorCodes.ERR_FILE_OPERATION_FAILED, {
				operation: 'upload_image',
				filename: file?.originalname || 'unknown',
				domain: 'infrastructure',
				error: error.message,
			});
		}
	}
}
