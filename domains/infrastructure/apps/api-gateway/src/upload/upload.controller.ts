import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
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
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpRequest } from '@venta/apitypes';
import { FileUploadACL, ImageUploadQuery, imageUploadQuerySchema } from '@venta/domains/infrastructure/contracts';
import type { FileUploadResult } from '@venta/domains/infrastructure/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { HttpAuthGuard } from '@venta/nest/guards';
import { GrpcInstance, Logger } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/pipes/schema-validator';
import {
	FILE_MANAGEMENT_SERVICE_NAME,
	FileManagementServiceClient,
	FileType,
} from '@venta/proto/infrastructure/file-management';
import { detectImageMimeFromMagicBytes, getAllowedUploadMimes, getMaxUploadSize } from '@venta/utils';
import { UPLOAD_METRICS, UploadMetrics } from './metrics.provider';

@Controller('upload')
@UseGuards(HttpAuthGuard)
export class UploadController {
	constructor(
		@Inject(FILE_MANAGEMENT_SERVICE_NAME)
		private readonly fileManagementClient: GrpcInstance<FileManagementServiceClient>,
		private readonly logger: Logger,
		private readonly configService: ConfigService,
		@Inject(UPLOAD_METRICS) private readonly metrics: UploadMetrics,
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
		const start = Date.now();
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
			const detectedType = detectImageMimeFromMagicBytes(file.buffer);
			const allowedTypes = getAllowedUploadMimes(this.configService);
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

			// Enforce configurable size cap at runtime as an extra guard
			const maxSize = getMaxUploadSize(this.configService);
			if (file.size > maxSize) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field: 'size',
					message: `File exceeds size limit (${maxSize} bytes)`,
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

			const grpcResult = await firstValueFrom(
				this.fileManagementClient
					.invoke('uploadImage', grpcRequest)
					.pipe(timeout({ each: Number(this.configService.get<string>('UPLOAD_GRPC_TIMEOUT_MS') || '10000') })),
			);

			// Metrics: success
			this.metrics.upload_requests_total.inc({ outcome: 'success' });
			this.metrics.upload_bytes.observe(file.size);
			this.metrics.upload_duration_seconds.observe({ outcome: 'success' }, (Date.now() - start) / 1000);

			// Transform gRPC response back to domain using ACL
			return FileUploadACL.fromGrpc(grpcResult);
		} catch (error) {
			// Metrics: failure
			this.metrics.upload_requests_total.inc({ outcome: 'error' });
			this.metrics.upload_duration_seconds.observe({ outcome: 'error' }, (Date.now() - start) / 1000);

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

// image magic-byte detection moved to libs/utils
