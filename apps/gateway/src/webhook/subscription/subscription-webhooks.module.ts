import { join } from 'path';
import { GrpcInstanceModule } from '@app/nest/modules';
import { USER_PACKAGE_NAME, USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Module } from '@nestjs/common';
import { SubscriptionWebhooksController } from './subscription-webhooks.controller';

@Module({
	controllers: [SubscriptionWebhooksController],
	imports: [
		GrpcInstanceModule.register<UserServiceClient>({
			protoPackage: USER_PACKAGE_NAME,
			protoPath: join(__dirname, `../../../libs/proto/src/definitions/user.proto`),
			provide: USER_SERVICE_NAME,
			serviceName: USER_SERVICE_NAME,
			urlEnvVar: 'USER_SERVICE_ADDRESS',
		}),
	],
	providers: [],
})
export class SubscriptionWebhooksModule {}
