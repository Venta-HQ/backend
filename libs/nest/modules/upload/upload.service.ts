import toStream from 'buffer-to-stream';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import { Injectable } from '@nestjs/common';

// Define proper type for uploaded file
export interface UploadedFile {
	buffer: Buffer;
	mimetype: string;
	originalname: string;
	size: number;
}

@Injectable()
export class UploadService {
	constructor(apiKey: string, apiSecret: string, cloudName: string) {
		cloudinary.config({
			api_key: apiKey,
			api_secret: apiSecret,
			cloud_name: cloudName,
		});
	}

	async uploadImage(file: UploadedFile): Promise<UploadApiResponse | UploadApiErrorResponse> {
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
