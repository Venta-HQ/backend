import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { Injectable, Logger } from '@nestjs/common';

import toStream = require('buffer-to-stream');

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

	async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
		return new Promise((resolve, reject) => {
			const upload = cloudinary.uploader.upload_stream((error, result) => {
				if (error) return reject(error);
				resolve(result);
			});

			toStream(file.buffer).pipe(upload);
		});
	}
}
