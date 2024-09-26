import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { DbchangeModule } from './dbchange.module';

async function bootstrap() {
	const app = await NestFactory.create(DbchangeModule, {
		logger: false,
	});
	app.useLogger(app.get(Logger));
	await app.listen(5003);
}
bootstrap();
