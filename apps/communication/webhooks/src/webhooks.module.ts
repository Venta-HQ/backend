import { APP_NAMES, BootstrapModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ClerkWebhooksModule } from './clerk-webhooks.module';
import { SubscriptionWebhooksModule } from './subscription-webhooks.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.CLERK_WEBHOOKS,
			protocol: 'http',
		}),
		ClerkWebhooksModule,
		SubscriptionWebhooksModule,
	],
})
export class WebhooksModule {}
