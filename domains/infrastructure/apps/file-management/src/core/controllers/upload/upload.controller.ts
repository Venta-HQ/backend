import { Controller, Post, UploadedFile } from '@nestjs/common';
import { FileUploadACL } from '@venta/domains/infrastructure/contracts';
import type { FileUploadResult } from '@venta/domains/infrastructure/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { UploadService } from '../../services/upload/upload.service';

@Controller()
export class UploadController {
	constructor(private uploadService: UploadService) {}

	@Post('image')
	async uploadImage(
		@UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
	): Promise<FileUploadResult> {
		try {
			// Transform HTTP input to domain using ACL
			const domainFile = FileUploadACL.toDomain({
				filename: file.originalname,
				mimetype: file.mimetype,
				buffer: file.buffer,
				size: file.size,
			});

			// Additional validation for image uploads
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
				...domainFile,
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
