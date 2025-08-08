import { Express } from 'express';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { GrpcInstance } from '@app/nest/modules';
import { FILE_MANAGEMENT_SERVICE_NAME, FileManagementServiceClient } from '@app/proto/infrastructure/file-management';
import { Controller, Inject, Logger, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class UploadController {
	private readonly logger = new Logger(UploadController.name);

	constructor(
		@Inject(FILE_MANAGEMENT_SERVICE_NAME)
		private readonly fileManagementClient: GrpcInstance<FileManagementServiceClient>,
	) {}

	@Post('image')
	@UseInterceptors(
		FileInterceptor('file', {
			limits: {
				fileSize: 5 * 1024 * 1024, // 5MB
			},
			fileFilter: (req, file, cb) => {
				if (!file.mimetype.startsWith('image/')) {
					cb(
						AppError.validation('INVALID_FILE_TYPE', 'Only image files are allowed', {
							providedType: file.mimetype,
							allowedTypes: ['image/*'],
						}),
						false,
					);
					return;
				}
				cb(null, true);
			},
		}),
	)
	async uploadImage(@UploadedFile() file: Express.Multer.File) {
		this.logger.debug('Handling image upload request', {
			filename: file?.originalname,
			size: file?.size,
		});

		try {
			if (!file) {
				throw AppError.validation('INVALID_INPUT', 'No file provided', {
					domain: 'infrastructure',
					operation: 'upload_image',
				});
			}

			const result = await this.fileManagementClient
				.invoke('uploadImage', {
					content: file.buffer,
					filename: file.originalname,
					mimetype: file.mimetype,
					size: file.size,
					uploadedBy: 'system', // TODO: Get from auth context
				})
				.toPromise();

			return result;
		} catch (error) {
			this.logger.error('Failed to upload image', {
				error: error.message,
				filename: file?.originalname,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal('UPLOAD_FAILED', 'Failed to upload file', {
				domain: 'infrastructure',
				operation: 'upload_image',
				error: error.message,
				filename: file?.originalname,
			});
		}
	}
}
