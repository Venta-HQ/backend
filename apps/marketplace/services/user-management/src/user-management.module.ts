import { APP_NAMES, BootstrapModule, NatsQueueModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { MarketplaceContractsModule } from '../contracts/marketplace-contracts.module';
import { AuthModule } from './authentication/auth.module';
import { CoreModule } from './core/core.module';
import { LocationModule } from './location/location.module';
import { SubscriptionModule } from './subscriptions/subscription.module';
import { VendorModule } from './vendors/vendor.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [NatsQueueModule],
			appName: APP_NAMES.USER,
			protocol: 'grpc',
		}),
		MarketplaceContractsModule,
		AuthModule,
		CoreModule,
		LocationModule,
		SubscriptionModule,
		VendorModule,
	],
})
export class UserManagementModule {}
