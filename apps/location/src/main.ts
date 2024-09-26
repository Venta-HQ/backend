import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { LOCATION_PACKAGE_NAME } from '@app/proto/location';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LocationModule } from './location.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(LocationModule, {
		options: {
			package: LOCATION_PACKAGE_NAME,
			protoPath: join(__dirname, `../proto/src/definitions/location.proto`),
			url: 'localhost:5001',
		},
		transport: Transport.GRPC,
	});

	app.useLogger(app.get(Logger));

	await app.listen();
}

bootstrap();
