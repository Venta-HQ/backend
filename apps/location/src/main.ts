import { join } from 'path';
import { GrpcErrorFilter } from '@app/nest/filters';
import { GrpcLogger } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME } from '@app/proto/location';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LocationModule } from './location.module';

async function bootstrap() {
	const app = await NestFactory.create(LocationModule);
	const configService = app.get(ConfigService);

	app.connectMicroservice<MicroserviceOptions>({
		options: {
			package: LOCATION_PACKAGE_NAME,
			protoPath: join(__dirname, `../proto/src/definitions/location.proto`),
			url: configService.get('LOCATION_SERVICE_URL', 'localhost:5002'),
		},
		transport: Transport.GRPC,
	});

	app.useGlobalFilters(new GrpcErrorFilter());
	app.useLogger(app.get(GrpcLogger));

	await app.startAllMicroservices();
	await app.listen(configService.get('LOCATION_SERVICE_PORT', 5002));
}

bootstrap();
