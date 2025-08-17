import { Module } from '@nestjs/common';
import { CloudinaryService, Logger } from '@venta/nest/modules';
import { UploadController } from './controllers/upload/upload.controller';
import { UploadService } from './services/upload/upload.service';

@Module({
	controllers: [UploadController],
	providers: [
		{
			provide: UploadService,
			useFactory: (logger: Logger) =>
				new UploadService(
					logger,
					process.env.CLOUDINARY_API_KEY || '',
					process.env.CLOUDINARY_API_SECRET || '',
					process.env.CLOUDINARY_CLOUD_NAME || '',
				),
			inject: [Logger],
		},
		CloudinaryService,
	],
})
export class CoreModule {}
