import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@venta/nest/guards';
import { GrpcInstanceModule } from '@venta/nest/modules';
import {
	FILE_MANAGEMENT_SERVICE_NAME,
	FileManagementServiceClient,
	INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME,
} from '@venta/proto/infrastructure/file-management';
import { UploadController } from './upload.controller';

@Module({
	imports: [
		AuthModule,
		ConfigModule,
		GrpcInstanceModule.register<FileManagementServiceClient>({
			proto: 'domains/infrastructure/file-management.proto',
			protoPackage: INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME,
			provide: FILE_MANAGEMENT_SERVICE_NAME,
			serviceName: FILE_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) =>
				configService.get('FILE_MANAGEMENT_SERVICE_ADDRESS') || 'localhost:5005',
		}),
	],
	controllers: [UploadController],
})
export class UploadModule {}
