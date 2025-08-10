import { PassThrough } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { Injectable, Logger } from '@nestjs/common';
import type { FileUpload, FileUploadResult } from '@venta/domains/infrastructure/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';

/**
 * File upload service for infrastructure domain
 */
@Injectable()
export class UploadService {
	private readonly logger = new Logger(UploadService.name);

	constructor(apiKey: string, apiSecret: string, cloudName: string) {
		cloudinary.config({
			api_key: apiKey,
			api_secret: apiSecret,
			cloud_name: cloudName,
		});
	}

	/**
	 * Upload a file to cloud storage
	 */
	async uploadFile(
		file: FileUpload & {
			uploadedBy: string;
		},
	): Promise<FileUploadResult> {
		try {
			const result = await this.uploadToCloudinary(file.buffer);

			return {
				url: result.secure_url,
				publicId: result.public_id,
				format: 'unknown', // Not available in simplified response
				bytes: file.size, // Use original file size
				createdAt: new Date().toISOString(),
			};
		} catch (error) {
			this.logger.error('Failed to upload file', {
				error: error.message,
				filename: file.filename,
				size: file.size,
			});

			throw AppError.internal(ErrorCodes.ERR_FILE_OPERATION_FAILED, {
				operation: 'upload',
				filename: file.filename,
				message: error.message,
			});
		}
	}

	/**
	 * Upload a file to Cloudinary
	 */
	private uploadToCloudinary(buffer: Buffer): Promise<{
		public_id: string;
		secure_url: string;
	}> {
		return new Promise((resolve, reject) => {
			const upload = cloudinary.uploader.upload_stream((error, result) => {
				if (error) return reject(error);
				if (!result) return reject(new Error('Upload failed: No result returned'));
				resolve({
					public_id: result.public_id,
					secure_url: result.secure_url,
				});
			});

			const bufferStream = new PassThrough();
			bufferStream.end(buffer);
			bufferStream.pipe(upload);
		});
	}
}
