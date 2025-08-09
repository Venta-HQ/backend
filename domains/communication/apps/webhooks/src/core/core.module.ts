import { Module } from '@nestjs/common';
import * as CommunicationToMarketplaceContextMapper from '@venta/domains/communication/contracts/context-mappers/communication-to-marketplace.context-mapper';
import { ClerkWebhooksController } from './controllers/clerk/clerk-webhooks.controller';
import { RevenueCatWebhooksController } from './controllers/revenuecat/revenuecat-webhooks.controller';

@Module({
	controllers: [ClerkWebhooksController, RevenueCatWebhooksController],
	providers: [],
})
export class CoreModule {}
