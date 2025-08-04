import { join } from 'path';
import { GrpcLogger } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { VendorModule } from './vendor.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(VendorModule, {
		options: {
			package: 'vendor',
			protoPath: join(__dirname, `../proto/src/definitions/vendor.proto`),
			url: process.env.VENDOR_SERVICE_ADDRESS || 'localhost:5005',
		},
		transport: Transport.GRPC,
	});
	
	const configService = app.get(ConfigService);
	app.useLogger(app.get(GrpcLogger));

	await app.listen();
}

bootstrap();
