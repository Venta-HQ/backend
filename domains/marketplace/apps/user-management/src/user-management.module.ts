import { Module } from '@nestjs/common';
import { APP_NAMES, BootstrapModule, NatsQueueModule } from '@venta/nest/modules';
import { MarketplaceContractsModule } from '../contracts/marketplace-contracts.module';
import { AuthModule } from './authentication/auth.module';
import { CoreModule } from './core/core.module';
import { UserManagementController } from './core/user-management.controller';
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
	controllers: [UserManagementController],
})
export class UserManagementModule {}
