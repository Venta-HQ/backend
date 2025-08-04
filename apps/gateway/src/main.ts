import { Logger } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);

	// Enable CORS
	app.enableCors({
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
	});

	app.useLogger(app.get(Logger));
	await app.listen(configService.get('GATEWAY_SERVICE_PORT', 5002), '0.0.0.0');
}

bootstrap();
