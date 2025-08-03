import { AppError, ErrorCodes } from '@app/errors';
import { UploadService } from '@app/upload';
import { Controller, Post, UploadedFile } from '@nestjs/common';

interface UploadedFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@Controller()
export class UploadController {
	constructor(private uploadService: UploadService) {}

	@Post('image')
	async uploadImage(@UploadedFile() file: UploadedFile) {
		try {
			return this.uploadService.uploadImage(file);
		} catch (e) {
			const err = e as Error;
			throw AppError.validation(ErrorCodes.INVALID_INPUT, { message: err.message });
		}
	}
}
