import { Module } from '@nestjs/common';
import { ClerkWebhooksService } from './clerk-webhooks.service';
import { ClerkWebhooksController } from './clerk-webhooks.controller';

@Module({
  imports: [],
  controllers: [ClerkWebhooksController],
  providers: [ClerkWebhooksService],
})
export class ClerkWebhooksModule {}
