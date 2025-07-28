import { join } from 'path';
import { ClerkModule, GrpcInstanceModule } from '@app/nest/modules';
import { USER_PACKAGE_NAME, USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';

@Module({
	controllers: [UserController],
	imports: [
		ClerkModule.register(),
		GrpcInstanceModule.register<UserServiceClient>({
			protoPackage: USER_PACKAGE_NAME,
			protoPath: join(__dirname, `../proto/src/definitions/user.proto`),
			provide: USER_SERVICE_NAME,
			serviceName: USER_SERVICE_NAME,
			urlEnvVar: 'USER_SERVICE_ADDRESS',
		}),
	],
})
export class UserModule {}
