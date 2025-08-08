import { v2 as cloudinary } from 'cloudinary';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { Injectable, Logger } from '@nestjs/common';
import { Infrastructure } from '../../../contracts/types/context-mapping.types';

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
	async uploadFile(file: {
		buffer: Buffer;
		mimetype: string;
		originalname: string;
		size: number;
		uploadedBy: string;
	}): Promise<Infrastructure.FileUploadResult> {
		try {
			const result = await this.uploadToCloudinary(file.buffer);

			return {
				fileId: result.public_id,
				url: result.secure_url,
				metadata: {
					filename: file.originalname,
					size: file.size,
					mimeType: file.mimetype,
					uploadedBy: file.uploadedBy,
					timestamp: new Date().toISOString(),
				},
				provider: 'cloudinary',
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			this.logger.error('Failed to upload file', {
				error: error.message,
				filename: file.originalname,
				size: file.size,
			});

			throw AppError.internal(ErrorCodes.UPLOAD_FAILED, 'Failed to upload file', {
				domain: 'infrastructure',
				operation: 'upload_file',
				error: error.message,
				filename: file.originalname,
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

			const stream = require('stream');
			const bufferStream = new stream.PassThrough();
			bufferStream.end(buffer);
			bufferStream.pipe(upload);
		});
	}
}
