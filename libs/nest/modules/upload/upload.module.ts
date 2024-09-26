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
						if (!configService.get('CLOUDINARY_API_SECRET')) {
							throw new Error('CLOUDINARY_API_SECRET required');
						}
						if (!configService.get('CLOUDINARY_API_KEY')) {
							throw new Error('CLOUDINARY_API_KEY required');
						}
						if (!configService.get('CLOUDINARY_CLOUD_NAME')) {
							throw new Error('CLOUDINARY_CLOUD_NAME required');
						}

						return new UploadService(
							configService.get('CLOUDINARY_API_KEY') ?? '',
							configService.get('CLOUDINARY_API_SECRET') ?? '',
							configService.get('CLOUDINARY_CLOUD_NAME') ?? '',
						);
					},
				},
			],
		};
	}
}
