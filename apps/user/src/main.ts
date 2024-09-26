import { join } from 'path';
import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserModule } from './user.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserModule, {
		logger: false,
		options: {
			package: 'user',
			protoPath: join(__dirname, `../proto/src/definitions/user.proto`),
			url: 'localhost:5000',
		},
		transport: Transport.GRPC,
	});
	app.useLogger(app.get(Logger));

	await app.listen();
}

bootstrap();
