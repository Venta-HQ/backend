import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
		options: {
			package: 'auth',
			protoPath: join(__dirname, `../proto/src/definitions/auth.proto`),
			url: 'localhost:5005',
		},
		transport: Transport.GRPC,
	});
	app.useLogger(app.get(Logger));

	await app.listen();
}

bootstrap();
