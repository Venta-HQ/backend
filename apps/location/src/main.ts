import { join } from 'path';
import { GrpcLogger } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME } from '@app/proto/location';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LocationModule } from './location.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(LocationModule, {
		options: {
			package: LOCATION_PACKAGE_NAME,
			protoPath: join(__dirname, `../proto/src/definitions/location.proto`),
			url: process.env.LOCATION_SERVICE_ADDRESS || 'localhost:5001',
		},
		transport: Transport.GRPC,
	});

	const configService = app.get(ConfigService);
	app.useLogger(app.get(GrpcLogger));

	await app.listen();
}

bootstrap();
