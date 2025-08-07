import { BootstrapService } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { WebsocketGatewayModule } from './websocket-gateway.module';

async function bootstrap() {
	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap HTTP service with health checks included
		await BootstrapService.bootstrapHttpService({
			module: WebsocketGatewayModule,
			port: configService.get('WEBSOCKET_GATEWAY_SERVICE_PORT') || 3003,
		});
	} catch (error) {
		console.error('Failed to start websocket-gateway service:', error);
		process.exit(1);
	}
}

bootstrap();
