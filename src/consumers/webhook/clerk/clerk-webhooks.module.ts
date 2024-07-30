import { Module } from '@nestjs/common';
import { ClerkWebhooksController } from './clerk-webhooks.controller';
import { ClerkWebhooksService } from './clerk-webhooks.service';

@Module({
	controllers: [ClerkWebhooksController],
	imports: [],
	providers: [ClerkWebhooksService],
})
export class ClerkWebhooksModule {}
