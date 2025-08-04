import { Logger } from '@app/nest/modules';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useLogger(app.get(Logger));
	await app.listen(5002, '0.0.0.0');
}

bootstrap();
