import { ConfigService } from '@nestjs/config';
import { BootstrapService } from '@venta/nest/modules';
import { WebhooksModule } from './webhooks.module';

async function bootstrap() {
	try {
		const configService = new ConfigService();
		await BootstrapService.bootstrapHttpService({
			domain: 'communication',
			module: WebhooksModule,
			port: configService.get('WEBHOOKS_SERVICE_PORT') || 3006,
		});
	} catch (error) {
		console.error('Failed to start webhooks service:', error);
		process.exit(1);
	}
}
bootstrap();
