import { join } from 'path';
import { GrpcLogger } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserModule } from './user.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserModule, {
		options: {
			package: 'user',
			protoPath: join(__dirname, `../proto/src/definitions/user.proto`),
			url: process.env.USER_SERVICE_ADDRESS || 'localhost:5000',
		},
		transport: Transport.GRPC,
	});

	app.get(ConfigService);
	app.useLogger(app.get(GrpcLogger));

	await app.listen();
}

bootstrap();
