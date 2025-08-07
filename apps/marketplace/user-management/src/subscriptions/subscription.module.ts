import { PrismaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
	controllers: [SubscriptionController],
	exports: [SubscriptionService],
	imports: [PrismaModule],
	providers: [SubscriptionService],
})
export class SubscriptionModule {}
