import { Injectable, Logger } from '@nestjs/common';
import { CloudinaryACL } from '@venta/domains/infrastructure/contracts/anti-corruption-layers/cloudinary-acl';
import { InfrastructureToMarketplaceContextMapper } from '@venta/domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace.context-mapper';
import { Infrastructure } from '@venta/domains/infrastructure/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { CloudinaryService } from '@venta/nest/modules';

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
				throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
					operation: 'validate_file_upload',
					filename: request.filename,
					mimetype: request.mimetype,
					size: request.size,
					message: 'Invalid file format or type',
				});
			}

			// Convert to Cloudinary options
			let options: any;
			try {
				options = this.cloudinaryACL.toCloudinaryOptions(request);
			} catch (error) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
					operation: 'convert_cloudinary_options',
					filename: request.filename,
					field: 'options',
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}

			// Upload file
			let result: any;
			try {
				result = await this.cloudinaryService.uploadBuffer(request.content, options);
			} catch (error) {
				throw AppError.externalService(ErrorCodes.ERR_EXTERNAL_SERVICE, {
					operation: 'upload_to_cloudinary',
					filename: request.filename,
					service: 'cloudinary',
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}

			// Convert response
			let uploadResult: Infrastructure.Core.FileUploadResult;
			try {
				uploadResult = this.cloudinaryACL.toDomainResult(result);
			} catch (error) {
				throw AppError.internal(ErrorCodes.ERR_UPLOAD, {
					operation: 'convert_upload_result',
					filename: request.filename,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}

			this.logger.debug('File upload completed', {
				fileId: uploadResult.fileId,
				url: uploadResult.url,
				context: uploadResult.context,
			});

			return uploadResult;
		} catch (error) {
			this.logger.error('Failed to upload file', {
				error: error instanceof Error ? error.message : 'Unknown error',
				filename: request.filename,
				size: request.size,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_UPLOAD, {
				operation: 'upload_file',
				filename: request.filename,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
