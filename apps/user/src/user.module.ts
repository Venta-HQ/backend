import { EventsModule, HealthModule, LoggerModule, PrismaModule, ConfigModule } from '@app/nest/modules';
import { ErrorHandlingModule } from '@app/nest/errors';
import { Module } from '@nestjs/common';
import { ClerkController } from './clerk/clerk.controller';
import { ClerkService } from './clerk/clerk.service';
import { SubscriptionController } from './subscription/subscription.controller';
import { SubscriptionService } from './subscription/subscription.service';
import { VendorController } from './vendor/vendor.controller';
import { VendorService } from './vendor/vendor.service';

@Module({
	controllers: [ClerkController, SubscriptionController, VendorController],
	imports: [
		ConfigModule,
		ErrorHandlingModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'user-service',
		}),
		LoggerModule.register({ appName: 'User Microservice', protocol: 'grpc' }),
		PrismaModule.register(),
	],
	providers: [ClerkService, SubscriptionService, VendorService],
})
export class UserModule {}
