import { Module } from '@nestjs/common';
import { APP_NAMES, BootstrapModule, NatsQueueModule } from '@venta/nest/modules';
import { CoreController } from './core/core.controller';
import { CoreModule } from './core/core.module';
import { SubscriptionModule } from './subscriptions/subscription.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [NatsQueueModule],
			appName: APP_NAMES.USER,
			protocol: 'grpc',
		}),

		CoreModule,
		SubscriptionModule,
	],
	controllers: [CoreController],
})
export class UserManagementModule {}
