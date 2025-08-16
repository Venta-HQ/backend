import { v2 as cloudinary, UploadApiOptions, UploadApiResponse } from 'cloudinary';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@venta/nest/modules';

@Injectable()
export class CloudinaryService {
	constructor(
		private readonly configService: ConfigService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(CloudinaryService.name);
		cloudinary.config({
			cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
			api_key: this.configService.get('CLOUDINARY_API_KEY'),
			api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
		});
	}

	async uploadBuffer(buffer: Buffer, options: UploadApiOptions = {}) {
		return new Promise<UploadApiResponse>((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
				if (error) return reject(error);
				if (!result) return reject(new Error('No result from Cloudinary'));
				resolve(result);
			});

			uploadStream.end(buffer);
		});
	}
}
