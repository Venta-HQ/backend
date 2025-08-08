import { AppError, ErrorCodes } from '@app/nest/errors';
import { Controller, Post, UploadedFile } from '@nestjs/common';
import { Infrastructure } from '../../../contracts/types/context-mapping.types';
import { UploadService } from './upload.service';

@Controller()
export class UploadController {
	constructor(private uploadService: UploadService) {}

	@Post('image')
	async uploadImage(
		@UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
	): Promise<Infrastructure.FileUploadResult> {
		try {
			if (!file) {
				throw AppError.validation(ErrorCodes.INVALID_INPUT, 'No file provided', {
					domain: 'infrastructure',
					operation: 'upload_image',
				});
			}

			if (!file.mimetype.startsWith('image/')) {
				throw AppError.validation(ErrorCodes.INVALID_FILE_TYPE, 'Only image files are allowed', {
					domain: 'infrastructure',
					operation: 'upload_image',
					providedType: file.mimetype,
					allowedTypes: ['image/*'],
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
				throw AppError.validation(ErrorCodes.FILE_TOO_LARGE, 'File exceeds size limit', {
					domain: 'infrastructure',
					operation: 'upload_image',
					fileSize: file?.size,
					maxSize: process.env.MAX_FILE_SIZE || '5MB',
				});
			}

			// Generic upload error with context
			throw AppError.internal(ErrorCodes.UPLOAD_FAILED, 'Failed to upload file', {
				domain: 'infrastructure',
				operation: 'upload_image',
				error: error.message,
				fileName: file?.originalname,
			});
		}
	}
}
