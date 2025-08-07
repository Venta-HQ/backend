import { APP_NAMES, BootstrapModule, NatsQueueModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ClerkController } from './clerk.controller';
import { ClerkService } from './clerk.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [ClerkController, SubscriptionController, VendorController],
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [NatsQueueModule],
			appName: APP_NAMES.USER,
			protocol: 'grpc',
		}),
	],
	providers: [ClerkService, SubscriptionService, VendorService],
})
export class UserModule {}
