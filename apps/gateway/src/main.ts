import helmet from 'helmet';
import { Logger } from '@app/logger';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);
	const logger = app.get(Logger);

	// Security headers
	app.use(helmet());

	// Global prefix
	app.setGlobalPrefix('api');

	// CORS configuration
	app.enableCors({
		origin: configService.get('CORS_ORIGIN', '*'),
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	});

	const port = configService.get('GATEWAY_SERVICE_PORT', 3000);
	await app.listen(port);

	logger.log(`Gateway service is running on port ${port}`, 'Bootstrap', {});
}

bootstrap().catch((error) => {
	console.error('Failed to start gateway service:', error);
	process.exit(1);
});
