import { Express } from 'express';
import { lastValueFrom } from 'rxjs';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { GrpcInstance } from '@app/nest/modules';
import {
	FILE_MANAGEMENT_SERVICE_NAME,
	FileManagementServiceClient,
	FileType,
} from '@app/proto/infrastructure/file-management';
import { Controller, Inject, Logger, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
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
						AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
							field: 'mimetype',
							value: file.mimetype,
							message: 'Only image files are allowed',
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
				throw AppError.validation(ErrorCodes.ERR_MISSING_FIELD, {
					field: 'file',
				});
			}

			const result = await lastValueFrom(
				this.fileManagementClient.invoke('uploadImage', {
					content: file.buffer,
					filename: file.originalname,
					mimetype: file.mimetype,
					size: file.size,
					type: FileType.AVATAR,
					uploadedBy: 'system', // TODO: Get from auth context
				}),
			);

			return result;
		} catch (error) {
			this.logger.error('Failed to upload image', {
				error: error.message,
				filename: file?.originalname,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_INFRA_UPLOAD_FAILED, {
				filename: file?.originalname,
				message: error.message,
			});
		}
	}
}
