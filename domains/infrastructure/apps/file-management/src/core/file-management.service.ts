import { AppError, ErrorCodes } from '@app/nest/errors';
import { CloudinaryService } from '@app/nest/modules';
import { CloudinaryACL } from '@domains/infrastructure/contracts/anti-corruption-layers/cloudinary-acl';
import { InfrastructureToMarketplaceContextMapper } from '@domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace-context-mapper';
import { Infrastructure } from '@domains/infrastructure/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';

/**
 * File management service for infrastructure domain
 */
@Injectable()
export class FileManagementService {
	private readonly logger = new Logger(FileManagementService.name);

	constructor(
		private readonly cloudinaryService: CloudinaryService,
		private readonly cloudinaryACL: CloudinaryACL,
		private readonly contextMapper: InfrastructureToMarketplaceContextMapper,
	) {}

	/**
	 * Upload a file to cloud storage
	 */
	async uploadFile(request: Infrastructure.Contracts.FileUpload): Promise<Infrastructure.Core.FileUploadResult> {
		this.logger.debug('Processing file upload request', {
			filename: request.filename,
			size: request.size,
			context: request.context,
		});

		try {
			// Validate request
			if (!this.cloudinaryACL.validateFileUpload(request as unknown)) {
				throw AppError.validation('INVALID_INPUT', 'Invalid input data', {
					filename: request.filename,
					mimetype: request.mimetype,
					size: request.size,
				});
			}

			// Convert to Cloudinary options
			const options = this.cloudinaryACL.toCloudinaryOptions(request);

			// Upload file
			const result = await this.cloudinaryService.uploadBuffer(request.content, options);

			// Convert response
			const uploadResult = this.cloudinaryACL.toDomainResult(result);

			// Emit event
			const event: Infrastructure.Events.FileUploaded = {
				file: {
					fileId: uploadResult.fileId,
					filename: uploadResult.filename,
					mimetype: uploadResult.mimetype,
					size: uploadResult.size,
					timestamp: uploadResult.timestamp,
					uploadedBy: uploadResult.uploadedBy,
					context: uploadResult.context,
				},
				timestamp: new Date().toISOString(),
			};

			this.logger.debug('File upload completed', {
				fileId: uploadResult.fileId,
				url: uploadResult.url,
				context: uploadResult.context,
			});

			return uploadResult;
		} catch (error) {
			this.logger.error('Failed to upload file', {
				error: error.message,
				filename: request.filename,
				size: request.size,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal('UPLOAD_FAILED', 'File upload failed', {
				filename: request.filename,
				error: error.message,
			});
		}
	}
}
