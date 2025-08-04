import { AppError, ErrorCodes } from '@app/nest/errors';
import { UploadService } from '@app/nest/modules';
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
	async uploadImage(@UploadedFile() file: any) {
		try {
			return this.uploadService.uploadImage(file);
		} catch (e) {
			const err = e as Error;
			throw AppError.validation(ErrorCodes.INVALID_INPUT, { message: err.message });
		}
	}
}
