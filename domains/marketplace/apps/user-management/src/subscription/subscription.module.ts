import { Module } from '@nestjs/common';
import { PrismaModule } from '@venta/nest/modules';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
	controllers: [SubscriptionController],
	exports: [SubscriptionService],
	imports: [PrismaModule.register()],
	providers: [SubscriptionService],
})
export class SubscriptionModule {}
