import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { Injectable } from '@nestjs/common';

// Use require for untyped module
const toStream = require('buffer-to-stream');

@Injectable()
export class UploadService {
	constructor(apiKey: string, apiSecret: string, cloudName: string) {
		cloudinary.config({
			api_key: apiKey,
			api_secret: apiSecret,
			cloud_name: cloudName,
		});
	}

	async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
		return new Promise((resolve, reject) => {
			const upload = cloudinary.uploader.upload_stream((error, result) => {
				if (error) return reject(error);
				if (result) {
					resolve(result);
				} else {
					reject(new Error('Upload failed: No result returned'));
				}
			});

			toStream(file.buffer).pipe(upload);
		});
	}
}
