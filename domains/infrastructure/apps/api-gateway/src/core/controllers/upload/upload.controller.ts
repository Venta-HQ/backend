import { lastValueFrom } from 'rxjs';
import { Controller, Inject, Logger, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadACL } from '@venta/domains/infrastructure/contracts';
import type { FileUploadResult } from '@venta/domains/infrastructure/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcInstance } from '@venta/nest/modules';
import {
	FILE_MANAGEMENT_SERVICE_NAME,
	FileManagementServiceClient,
	FileType,
} from '@venta/proto/infrastructure/file-management';

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
						AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
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
	async uploadImage(@UploadedFile() file: Express.Multer.File): Promise<FileUploadResult> {
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

			// Transform HTTP multipart file to domain using ACL
			const domainFile = FileUploadACL.toDomain({
				filename: file.originalname,
				mimetype: file.mimetype,
				buffer: file.buffer,
				size: file.size,
			});

			// Transform domain to gRPC message using ACL
			const grpcRequest = FileUploadACL.toGrpc(domainFile, {
				type: FileType.AVATAR,
				uploadedBy: 'system', // TODO: Get from auth context
			});

			const grpcResult = await lastValueFrom(this.fileManagementClient.invoke('uploadImage', grpcRequest));

			// Transform gRPC response back to domain using ACL
			return FileUploadACL.fromGrpc(grpcResult);
		} catch (error) {
			this.logger.error('Failed to upload image', {
				error: error.message,
				filename: file?.originalname,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_FILE_OPERATION_FAILED, {
				operation: 'upload',
				filename: file?.originalname || 'unknown',
				message: error.message,
			});
		}
	}
}
