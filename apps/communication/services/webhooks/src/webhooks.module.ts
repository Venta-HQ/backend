import { APP_NAMES, BootstrapModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ClerkWebhooksModule } from './clerk/clerk-webhooks.module';
import { RevenueCatWebhooksModule } from './revenuecat/revenuecat-webhooks.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.CLERK_WEBHOOKS,
			domain: 'communication', // DDD domain for communication services
			protocol: 'http',
		}),
		ClerkWebhooksModule,
		RevenueCatWebhooksModule,
	],
})
export class WebhooksModule {}
