import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { VendorModule } from './vendor.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(VendorModule, {
		options: {
			package: 'vendor',
			protoPath: join(__dirname, `../proto/src/definitions/vendor.proto`),
			url: 'localhost:5005',
		},
		transport: Transport.GRPC,
	});

	app.useLogger(app.get(Logger));
	await app.listen();
}

bootstrap();
