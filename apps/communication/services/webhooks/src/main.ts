import { NestFactory } from '@nestjs/core';
import { WebhooksModule } from './webhooks.module';

async function bootstrap() {
	const app = await NestFactory.create(WebhooksModule);
	await app.listen(process.env.PORT || 3006);
}
bootstrap();
