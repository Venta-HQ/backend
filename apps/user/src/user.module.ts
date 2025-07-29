import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/database';
import { ErrorHandlingModule } from '@app/errors';
import { EventsModule } from '@app/events';
import { LoggerModule } from '@app/logger';
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
		EventsModule,
		LoggerModule.register({ appName: 'User Microservice', protocol: 'grpc' }),
		PrismaModule.register(),
		ErrorHandlingModule,
	],
	providers: [ClerkService, SubscriptionService, VendorService],
})
export class UserModule {}
