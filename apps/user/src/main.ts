import { join } from 'path';
import { GrpcErrorFilter } from '@app/nest/filters';
import { GrpcLogger } from '@app/nest/modules';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserModule } from './user.module';

async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(UserModule, {
		options: {
			package: 'user',
			protoPath: join(__dirname, `../proto/src/definitions/user.proto`),
			url: 'localhost:5000',
		},
		transport: Transport.GRPC,
	});
	app.useGlobalFilters(new GrpcErrorFilter());
	app.useLogger(app.get(GrpcLogger));

	await app.listen();
}

bootstrap();
