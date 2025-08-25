import { ConfigService } from '@nestjs/config';
import { BootstrapService } from '@venta/nest/modules';
import { WebhooksGatewayModule } from './webhooks-gateway.module';

async function bootstrap() {
	try {
		const configService = new ConfigService();
		await BootstrapService.bootstrapHttpService({
			domain: 'communication',
			module: WebhooksGatewayModule,
			port: configService.get('WEBHOOKS_GATEWAY_SERVICE_PORT') || 5006,
		});
	} catch (error) {
		console.error('Failed to start webhooks service:', error);
		process.exit(1);
	}
}
bootstrap();
