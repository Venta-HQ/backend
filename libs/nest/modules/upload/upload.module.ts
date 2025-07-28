import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';

@Module({})
export class UploadModule {
	static register(): DynamicModule {
		return {
			exports: [UploadService],
			global: true,
			imports: [ConfigModule],
			module: UploadModule,
			providers: [
				{
					inject: [ConfigService],
					provide: UploadService,
					useFactory: (configService: ConfigService) => {
						const apiKey = configService.get('CLOUDINARY_API_KEY');
						const apiSecret = configService.get('CLOUDINARY_API_SECRET');
						const cloudName = configService.get('CLOUDINARY_CLOUD_NAME');

						return new UploadService(apiKey, apiSecret, cloudName);
					},
				},
			],
		};
	}
}
