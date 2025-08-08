import { CommunicationToMarketplaceContextMapper } from '@domains/communication/contracts/context-mappers/communication-to-marketplace-context-mapper';
import { Module } from '@nestjs/common';
import { ClerkWebhooksController } from './controllers/clerk/clerk-webhooks.controller';
import { RevenueCatWebhooksController } from './controllers/revenuecat/revenuecat-webhooks.controller';

@Module({
	controllers: [ClerkWebhooksController, RevenueCatWebhooksController],
	providers: [CommunicationToMarketplaceContextMapper],
})
export class CoreModule {}
