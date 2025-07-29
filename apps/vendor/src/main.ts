import { join } from 'path';
import { Logger } from '@app/logger';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { VendorModule } from './vendor.module';

async function bootstrap() {
	const app = await NestFactory.create(VendorModule);
	const configService = app.get(ConfigService);

	app.connectMicroservice<MicroserviceOptions>({
		options: {
			package: 'vendor',
			protoPath: join(__dirname, `../../libs/proto/src/definitions/vendor.proto`),
			url: configService.get('VENDOR_SERVICE_URL', 'localhost:5001'),
		},
		transport: Transport.GRPC,
	});

	// Error handling is configured in the ErrorHandlingModule
	app.useLogger(app.get(Logger));

	await app.startAllMicroservices();
	await app.listen(configService.get('VENDOR_SERVICE_PORT', 5001));
}

bootstrap();
