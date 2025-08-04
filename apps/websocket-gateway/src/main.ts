import { Logger } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WebsocketGatewayModule } from './websocket-gateway.module';

async function bootstrap() {
	const app = await NestFactory.create(WebsocketGatewayModule);
	const configService = app.get(ConfigService);
	
	// Standard logger setup
	app.useLogger(app.get(Logger));
	
	await app.listen(configService.get('WEBSOCKET_GATEWAY_SERVICE_PORT', 5004), '0.0.0.0');
}
bootstrap();
