import { BootstrapService } from '@app/nest/modules';
import { WebsocketGatewayModule } from './websocket-gateway.module';

async function bootstrap() {
	try {
		// Bootstrap HTTP service with health checks included
		await BootstrapService.bootstrapHttpService({
			module: WebsocketGatewayModule,
			port: 'WEBSOCKET_GATEWAY_SERVICE_PORT',
		});
	} catch (error) {
		console.error('Failed to start websocket-gateway service:', error);
		process.exit(1);
	}
}

bootstrap();
