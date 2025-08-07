import { APP_NAMES, BootstrapModule, GrpcInstanceModule } from '@app/nest/modules';
import { USER_PACKAGE_NAME, USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SubscriptionWebhooksController } from './subscription/subscription-webhooks.controller';

@Module({
	controllers: [SubscriptionWebhooksController],
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.SUBSCRIPTION_WEBHOOKS,
			protocol: 'http',
		}),
		GrpcInstanceModule.register<UserServiceClient>({
			proto: 'user.proto',
			protoPackage: USER_PACKAGE_NAME,
			provide: USER_SERVICE_NAME,
			serviceName: USER_SERVICE_NAME,
			urlFactory: (configService: ConfigService) => configService.get('USER_SERVICE_ADDRESS') || 'localhost:5000',
		}),
	],
})
export class SubscriptionWebhooksModule {}
