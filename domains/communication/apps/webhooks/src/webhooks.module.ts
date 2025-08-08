import { BootstrapModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'webhooks',
			domain: 'communication',
			protocol: 'http',
		}),
		ConfigModule,
		CoreModule,
	],
})
export class WebhooksModule {}
