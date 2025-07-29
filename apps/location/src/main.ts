import { join } from 'path';
import { Logger } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LocationModule } from './location.module';

async function bootstrap() {
	const app = await NestFactory.create(LocationModule);
	const configService = app.get(ConfigService);

	app.connectMicroservice<MicroserviceOptions>({
		options: {
			package: 'location',
			protoPath: join(__dirname, `../../libs/proto/src/definitions/location.proto`),
			url: configService.get('LOCATION_SERVICE_URL', 'localhost:5003'),
		},
		transport: Transport.GRPC,
	});

	// Error handling is configured in the ErrorHandlingModule
	app.useLogger(app.get(Logger));

	await app.startAllMicroservices();
	await app.listen(configService.get('LOCATION_SERVICE_PORT', 5003));
}

bootstrap();
