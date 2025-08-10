import { Module } from '@nestjs/common';
import { CloudinaryService } from '@venta/nest/modules';
import { UploadController } from './controllers/upload/upload.controller';
import { UploadService } from './services/upload/upload.service';

@Module({
	controllers: [UploadController],
	providers: [
		{
			provide: UploadService,
			useFactory: () =>
				new UploadService(
					process.env.CLOUDINARY_API_KEY || '',
					process.env.CLOUDINARY_API_SECRET || '',
					process.env.CLOUDINARY_CLOUD_NAME || '',
				),
		},
		CloudinaryService,
	],
})
export class CoreModule {}
