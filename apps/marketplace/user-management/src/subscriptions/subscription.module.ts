import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PrismaModule } from '@app/nest/modules';

@Module({
	imports: [PrismaModule],
	controllers: [SubscriptionController],
	providers: [SubscriptionService],
	exports: [SubscriptionService],
})
export class SubscriptionModule {} 