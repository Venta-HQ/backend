import { BootstrapService } from '@app/nest/modules';
import { WebsocketGatewayModule } from './websocket-gateway.module';

async function bootstrap() {
	await BootstrapService.bootstrap({
		appName: 'WebSocket Gateway Service',
		http: {
			port: 'WEBSOCKET_GATEWAY_SERVICE_PORT',
		},
		module: WebsocketGatewayModule,
	});
}

bootstrap();
