import { Module } from '@nestjs/common';
import { APP_NAMES, BootstrapModule, NatsQueueModule } from '@venta/nest/modules';
import { AuthModule } from './authentication/auth.module';
import { CoreController } from './core/core.controller';
import { CoreModule } from './core/core.module';
import { LocationModule } from './location/location.module';
import { SubscriptionModule } from './subscriptions/subscription.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [NatsQueueModule],
			appName: APP_NAMES.USER,
			protocol: 'grpc',
		}),

		AuthModule,
		CoreModule,
		LocationModule,
		SubscriptionModule,
	],
	controllers: [CoreController],
})
export class UserManagementModule {}
