import { firstValueFrom } from 'rxjs';
import {
	Controller,
	Inject,
	Post,
	Query,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
	UsePipes,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpRequest } from '@venta/apitypes';
import { FileUploadACL, ImageUploadQuery, imageUploadQuerySchema } from '@venta/domains/infrastructure/contracts';
import type { FileUploadResult } from '@venta/domains/infrastructure/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { HttpAuthGuard } from '@venta/nest/guards';
import { GrpcInstance, Logger } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/validation';
import {
	FILE_MANAGEMENT_SERVICE_NAME,
	FileManagementServiceClient,
	FileType,
} from '@venta/proto/infrastructure/file-management';

@Controller('upload')
@UseGuards(HttpAuthGuard)
export class UploadController {
	constructor(
		@Inject(FILE_MANAGEMENT_SERVICE_NAME)
		private readonly fileManagementClient: GrpcInstance<FileManagementServiceClient>,
		private readonly logger: Logger,
	) {
		this.logger.setContext(UploadController.name);
	}

	@Post('image')
	@UseInterceptors(
		FileInterceptor('file', {
			limits: {
				fileSize: 5 * 1024 * 1024, // 5MB
				files: 1,
				fields: 0,
				parts: 1,
			},
			fileFilter: (_req, file, cb) => {
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
	@UsePipes(new SchemaValidatorPipe(imageUploadQuerySchema))
	async uploadImage(
		@UploadedFile() file: Express.Multer.File,
		@Query() _query: ImageUploadQuery,
		@Req() req: HttpRequest,
	): Promise<FileUploadResult> {
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

			// Basic magic-byte verification for common image types
			const detectedType = detectCommonImageType(file.buffer);
			const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
			if (!detectedType || !allowedTypes.includes(detectedType)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field: 'mimetype',
					value: file.mimetype,
					message: 'Unsupported or invalid image type',
				});
			}
			if (file.mimetype !== detectedType) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field: 'mimetype',
					value: file.mimetype,
					message: 'MIME type does not match file content',
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
				uploadedBy: req.user?.id || 'anonymous',
			});

			const grpcResult = await firstValueFrom(this.fileManagementClient.invoke('uploadImage', grpcRequest));

			// Transform gRPC response back to domain using ACL
			return FileUploadACL.fromGrpc(grpcResult);
		} catch (error) {
			this.logger.error('Failed to upload image', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				filename: file?.originalname,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal(ErrorCodes.ERR_FILE_OPERATION_FAILED, {
				operation: 'upload',
				filename: file?.originalname || 'unknown',
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}

// Minimal magic-byte detection for common image types used in uploads
function detectCommonImageType(buffer: Buffer): string | null {
	if (!buffer || buffer.length < 12) return null;
	// JPEG: FF D8 FF
	if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (
		buffer[0] === 0x89 &&
		buffer[1] === 0x50 &&
		buffer[2] === 0x4e &&
		buffer[3] === 0x47 &&
		buffer[4] === 0x0d &&
		buffer[5] === 0x0a &&
		buffer[6] === 0x1a &&
		buffer[7] === 0x0a
	)
		return 'image/png';
	// GIF: ASCII GIF87a or GIF89a
	if (
		buffer[0] === 0x47 &&
		buffer[1] === 0x49 &&
		buffer[2] === 0x46 &&
		buffer[3] === 0x38 &&
		(buffer[4] === 0x37 || buffer[4] === 0x39) &&
		buffer[5] === 0x61
	)
		return 'image/gif';
	// WEBP: RIFF....WEBP
	if (
		buffer[0] === 0x52 &&
		buffer[1] === 0x49 &&
		buffer[2] === 0x46 &&
		buffer[3] === 0x46 &&
		buffer[8] === 0x57 &&
		buffer[9] === 0x45 &&
		buffer[10] === 0x42 &&
		buffer[11] === 0x50
	)
		return 'image/webp';
	return null;
}
