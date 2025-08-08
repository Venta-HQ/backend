import { v2 as cloudinary } from 'cloudinary';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
	private readonly logger = new Logger(CloudinaryService.name);

	constructor(private readonly configService: ConfigService) {
		cloudinary.config({
			cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
			api_key: this.configService.get('CLOUDINARY_API_KEY'),
			api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
		});
	}

	async uploadBuffer(buffer: Buffer, options: cloudinary.UploadApiOptions = {}) {
		return new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
				if (error) return reject(error);
				if (!result) return reject(new Error('No result from Cloudinary'));
				resolve(result);
			});

			uploadStream.end(buffer);
		});
	}
}
