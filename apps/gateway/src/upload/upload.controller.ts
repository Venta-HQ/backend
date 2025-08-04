import { AppError, ErrorCodes } from '@app/nest/errors';
import { UploadService, UploadedFile } from '@app/nest/modules';
import { Controller, Post, UploadedFile as NestUploadedFile } from '@nestjs/common';

@Controller()
export class UploadController {
	constructor(private uploadService: UploadService) {}

	@Post('image')
	async uploadImage(@NestUploadedFile() file: UploadedFile) {
		try {
			return this.uploadService.uploadImage(file);
		} catch (e) {
			const err = e as Error;
			throw AppError.validation(ErrorCodes.INVALID_INPUT, { message: err.message });
		}
	}
}
