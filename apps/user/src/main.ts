import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserModule } from './user.module';

async function bootstrap() {
	const app = await NestFactory.create(UserModule);
	const configService = app.get(ConfigService);

	app.connectMicroservice<MicroserviceOptions>({
		options: {
			package: 'user',
			protoPath: join(__dirname, `../../libs/proto/src/definitions/user.proto`),
			url: configService.get('USER_SERVICE_URL', 'localhost:5000'),
		},
		transport: Transport.GRPC,
	});

	// Error handling is configured in the ErrorHandlingModule

	await app.startAllMicroservices();
	await app.listen(configService.get('USER_SERVICE_PORT', 5000));
}

bootstrap();
