import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BootstrapModule } from '@venta/nest/modules';
import { ClerkModule } from './clerk/clerk.module';
import { RevenueCatModule } from './revenuecat/revenuecat.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'webhooks',
			domain: 'communication',
			protocol: 'http',
		}),
		ConfigModule,
		ClerkModule,
		RevenueCatModule,
	],
})
export class WebhooksModule {}
