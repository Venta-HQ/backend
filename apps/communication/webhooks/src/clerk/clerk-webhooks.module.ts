import { Module } from '@nestjs/common';
import { ClerkWebhooksController } from './clerk-webhooks.controller';

@Module({
	controllers: [ClerkWebhooksController],
})
export class ClerkWebhooksModule {}
