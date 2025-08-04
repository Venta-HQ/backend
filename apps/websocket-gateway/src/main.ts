import { BootstrapService } from '@app/nest/modules';
import { WebsocketGatewayModule } from './websocket-gateway.module';

async function bootstrap() {
	await BootstrapService.bootstrapHttp({
		module: WebsocketGatewayModule,
		port: 'WEBSOCKET_GATEWAY_SERVICE_PORT',
	});
}

bootstrap();
