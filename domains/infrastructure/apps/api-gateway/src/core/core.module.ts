import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@venta/nest/guards';
import { GrpcInstanceModule } from '@venta/nest/modules';
import {
	FILE_MANAGEMENT_SERVICE_NAME,
	FileManagementServiceClient,
	INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME,
} from '@venta/proto/infrastructure/file-management';
import {
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	USER_MANAGEMENT_SERVICE_NAME,
	UserManagementServiceClient,
} from '@venta/proto/marketplace/user-management';
import {
	MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME,
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorManagementServiceClient,
} from '@venta/proto/marketplace/vendor-management';
import { UploadController } from './controllers/upload/upload.controller';
import { UserController } from './controllers/user/user.controller';
import { VendorController } from './controllers/vendor/vendor.controller';

@Module({
	imports: [
		AuthModule,
		ConfigModule,
		GrpcInstanceModule.register<UserManagementServiceClient>({
			proto: 'domains/marketplace/user-management.proto',
			protoPackage: MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
			provide: USER_MANAGEMENT_SERVICE_NAME,
			serviceName: USER_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) =>
				configService.get('USER_MANAGEMENT_SERVICE_ADDRESS') || 'localhost:5002',
		}),
		GrpcInstanceModule.register<VendorManagementServiceClient>({
			proto: 'domains/marketplace/vendor-management.proto',
			protoPackage: MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME,
			provide: VENDOR_MANAGEMENT_SERVICE_NAME,
			serviceName: VENDOR_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) =>
				configService.get('VENDOR_MANAGEMENT_SERVICE_ADDRESS') || 'localhost:5004',
		}),
		GrpcInstanceModule.register<FileManagementServiceClient>({
			proto: 'domains/infrastructure/file-management.proto',
			protoPackage: INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME,
			provide: FILE_MANAGEMENT_SERVICE_NAME,
			serviceName: FILE_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) =>
				configService.get('FILE_MANAGEMENT_SERVICE_ADDRESS') || 'localhost:5005',
		}),
	],
	controllers: [UploadController, UserController, VendorController],
})
export class CoreModule {}
