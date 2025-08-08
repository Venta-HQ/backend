import { GrpcInstanceModule } from '@app/nest/modules';
import {
	FILE_MANAGEMENT_SERVICE_NAME,
	FileManagementServiceClient,
	INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME,
} from '@app/proto/infrastructure/file-management';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';

@Module({
	controllers: [UploadController],
	imports: [
		ConfigModule,
		MulterModule.register({
			limits: {
				fileSize: 5 * 1024 * 1024, // 5MB
			},
		}),
		GrpcInstanceModule.register<FileManagementServiceClient>({
			proto: 'file-management.proto',
			protoPackage: INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME,
			provide: FILE_MANAGEMENT_SERVICE_NAME,
			serviceName: FILE_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) =>
				configService.get('FILE_MANAGEMENT_SERVICE_ADDRESS') || 'localhost:5002',
		}),
	],
})
export class UploadModule {}
