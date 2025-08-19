import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@venta/nest/guards';
import { GrpcInstanceModule } from '@venta/nest/modules';
import {
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	USER_MANAGEMENT_SERVICE_NAME,
	UserManagementServiceClient,
} from '@venta/proto/marketplace/user-management';
import { UserController } from './user.controller';

@Module({
	imports: [
		AuthModule,
		ConfigModule,
		GrpcInstanceModule.register<UserManagementServiceClient>({
			proto: 'domains/marketplace/user-management.proto',
			protoPackage: MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
			provide: USER_MANAGEMENT_SERVICE_NAME,
			serviceName: USER_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) => configService.get('USER_SERVICE_ADDRESS') || 'localhost:5002',
		}),
	],
	controllers: [UserController],
})
export class UserModule {}
