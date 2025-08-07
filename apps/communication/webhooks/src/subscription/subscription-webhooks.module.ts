import { Module } from '@nestjs/common';
import { SubscriptionWebhooksController } from './subscription-webhooks.controller';

@Module({
	controllers: [SubscriptionWebhooksController],
})
export class SubscriptionWebhooksModule {}