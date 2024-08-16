import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LocationModule } from './location.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(LocationModule, {
		options: {
			package: 'location',
			protoPath: join(__dirname, `../proto/src/definitions/location.proto`),
			url: 'localhost:5001',
		},
		transport: Transport.GRPC,
	});

	app.useLogger(app.get(Logger));

	await app.listen();
}

bootstrap();
