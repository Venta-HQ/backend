import { ClerkModule, GrpcInstanceModule } from 'libs/nest/modules';
import {
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	USER_MANAGEMENT_SERVICE_NAME,
	UserManagementServiceClient,
} from '@app/proto/marketplace/user-management';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserController } from './user.controller';

@Module({
	controllers: [UserController],
	imports: [
		ClerkModule.register(),
		ConfigModule,
		GrpcInstanceModule.register<UserManagementServiceClient>({
			proto: 'user.proto',
			protoPackage: MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
			provide: USER_MANAGEMENT_SERVICE_NAME,
			serviceName: USER_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) => configService.get('USER_SERVICE_ADDRESS') || 'localhost:5000',
		}),
	],
})
export class UserModule {}
