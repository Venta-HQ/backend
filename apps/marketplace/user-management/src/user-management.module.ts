import { APP_NAMES, BootstrapModule, NatsQueueModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { AuthModule } from './authentication/auth.module';
import { SubscriptionModule } from './subscriptions/subscription.module';
import { UserLocationEventsController } from './user-location-events.controller';
import { UserService } from './user.service';
import { VendorModule } from './vendors/vendor.module';

@Module({
	controllers: [UserLocationEventsController],
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
	providers: [UserService],
})
export class UserModule {}
