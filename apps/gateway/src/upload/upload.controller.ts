import { AppError, ErrorCodes } from '@app/nest/errors';
import { AuthGuard } from '@app/nest/guards';
import { UploadService } from '@app/nest/modules';
import { Controller, Logger, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class UploadController {
	private readonly logger = new Logger(UploadController.name);

	constructor(private uploadService: UploadService) {}

	@Post('image')
	@UseGuards(AuthGuard)
	@UseInterceptors(FileInterceptor('file'))
	uploadImage(@UploadedFile() file: Express.Multer.File) {
		try {
			return this.uploadService.uploadImage(file);
		} catch (e) {
			throw AppError.validation(ErrorCodes.INVALID_INPUT, { message: e.message });
		}
	}
}
