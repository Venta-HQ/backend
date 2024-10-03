import { join } from 'path';
import { GrpcErrorFilter } from '@app/nest/filters';
import { GrpcLogger } from '@app/nest/modules';
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
	app.useGlobalFilters(new GrpcErrorFilter());
	app.useLogger(app.get(GrpcLogger));

	await app.listen();
}

bootstrap();
