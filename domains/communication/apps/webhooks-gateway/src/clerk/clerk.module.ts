import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GrpcInstanceModule } from '@venta/nest/modules';
import {
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	USER_MANAGEMENT_SERVICE_NAME,
	UserManagementServiceClient,
} from '@venta/proto/marketplace/user-management';
import { ClerkController } from './clerk.controller';

@Module({
	controllers: [ClerkController],
	imports: [
		GrpcInstanceModule.register<UserManagementServiceClient>({
			proto: 'domains/marketplace/user-management.proto',
			protoPackage: MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
			provide: USER_MANAGEMENT_SERVICE_NAME,
			serviceName: USER_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) => configService.get('USER_SERVICE_ADDRESS') || 'localhost:5000',
		}),
	],
})
export class ClerkModule {}
