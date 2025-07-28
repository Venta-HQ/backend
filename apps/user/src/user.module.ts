import { ErrorHandlingModule } from '@app/nest/errors';
import { ConfigModule, EventsModule, GrpcLoggerModule, PrismaModule } from '@app/nest/modules';
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
		GrpcLoggerModule.register('User Microservice'),
		PrismaModule.register(),
		ErrorHandlingModule,
	],
	providers: [ClerkService, SubscriptionService, VendorService],
})
export class UserModule {}
