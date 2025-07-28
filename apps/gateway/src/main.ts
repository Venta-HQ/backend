import { Logger } from 'nestjs-pino';
import { HttpErrorFilter } from '@app/nest/filters';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);
	
	app.useGlobalFilters(new HttpErrorFilter());
	app.useLogger(app.get(Logger));
	await app.listen(configService.get('GATEWAY_SERVICE_PORT', 5003), '0.0.0.0');
}

bootstrap();
