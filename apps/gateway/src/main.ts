import { Logger } from 'nestjs-pino';
import { HttpErrorFilter } from '@app/nest/filters';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalFilters(new HttpErrorFilter());
	app.useLogger(app.get(Logger));
	await app.listen(3000);
}

bootstrap();
