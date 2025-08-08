import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { CloudinaryService } from '@app/nest/modules';
import { Injectable, Logger } from '@nestjs/common';

interface FileUploadData {
	buffer: Buffer;
	mimetype: string;
	originalname: string;
	size: number;
	uploadedBy: string;
}

interface FileUploadResult {
	url: string;
	publicId: string;
	format: string;
	width: number;
	height: number;
	bytes: number;
}

@Injectable()
export class FileManagementService {
	private readonly logger = new Logger(FileManagementService.name);

	constructor(private readonly cloudinary: CloudinaryService) {}

	/**
	 * Upload file to cloud storage
	 * Domain method for file management
	 */
	async uploadFile(data: FileUploadData): Promise<FileUploadResult> {
		this.logger.log('Starting file upload process', {
			filename: data.originalname,
			size: data.size,
			type: data.mimetype,
			uploadedBy: data.uploadedBy,
		});

		try {
			// Upload to Cloudinary
			const result = await this.cloudinary.uploadBuffer(data.buffer, {
				folder: process.env.CLOUDINARY_FOLDER || 'venta',
				resource_type: 'auto',
			});

			this.logger.log('File uploaded successfully', {
				filename: data.originalname,
				publicId: result.public_id,
				url: result.secure_url,
			});

			return {
				url: result.secure_url,
				publicId: result.public_id,
				format: result.format,
				width: result.width,
				height: result.height,
				bytes: result.bytes,
			};
		} catch (error) {
			this.logger.error('Failed to upload file to cloud storage', {
				error: error.message,
				filename: data.originalname,
			});

			throw AppError.externalService('UPLOAD_FAILED', 'Failed to upload file', {
				filename: data.originalname,
				operation: 'upload_file',
				provider: 'cloudinary',
			});
		}
	}
}
