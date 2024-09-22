import { LoggerModule, PrismaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkController } from './clerk/clerk.controller';
import { ClerkService } from './clerk/clerk.service';
import { SubscriptionController } from './subscription/subscription.controller';
import { SubscriptionService } from './subscription/subscription.service';

@Module({
	controllers: [ClerkController, SubscriptionController],
	imports: [ConfigModule.forRoot(), LoggerModule.register('User Microservice'), PrismaModule.register()],
	providers: [ClerkService, SubscriptionService],
})
export class UserModule {}
