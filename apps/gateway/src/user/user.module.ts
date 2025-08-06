import { ClerkModule, GrpcInstanceModule } from 'libs/nest/modules';
import { USER_PACKAGE_NAME, USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserController } from './user.controller';

@Module({
	controllers: [UserController],
	imports: [
		ClerkModule.register(),
		ConfigModule,
		GrpcInstanceModule.register<UserServiceClient>({
			proto: 'user.proto',
			protoPackage: USER_PACKAGE_NAME,
			provide: USER_SERVICE_NAME,
			serviceName: USER_SERVICE_NAME,
			url: 'USER_SERVICE_ADDRESS',
		}),
	],
	providers: [
		{
			provide: 'USER_SERVICE_URL',
			useFactory: (configService: ConfigService) => configService.get('USER_SERVICE_ADDRESS') || 'localhost:5000',
			inject: [ConfigService],
		},
	],
})
export class UserModule {}
