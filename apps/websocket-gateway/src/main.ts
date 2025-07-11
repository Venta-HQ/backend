import { NestFactory } from '@nestjs/core';
import { WebsocketGatewayModule } from './websocket-gateway.module';

async function bootstrap() {
	const app = await NestFactory.create(WebsocketGatewayModule);
	await app.listen(5004, '0.0.0.0');
}
bootstrap();
