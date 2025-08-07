import { APP_NAMES, BootstrapModule, NatsQueueModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { AuthModule } from './authentication/auth.module';
import { SubscriptionModule } from './subscriptions/subscription.module';
import { VendorModule } from './relationships/vendor.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [NatsQueueModule],
			appName: APP_NAMES.USER,
			protocol: 'grpc',
		}),
		AuthModule,
		SubscriptionModule,
		VendorModule,
	],
})
export class UserModule {}
