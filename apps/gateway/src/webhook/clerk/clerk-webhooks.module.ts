import { join } from 'path';
import { AUTH_SERVICE_NAME } from '@app/proto/auth';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClerkWebhooksController } from './clerk-webhooks.controller';

@Module({
	controllers: [ClerkWebhooksController],
	imports: [
		ClientsModule.register([
			{
				name: AUTH_SERVICE_NAME,
				options: {
					package: 'auth',
					protoPath: join(__dirname, `../proto/src/definitions/auth.proto`),
				},
				transport: Transport.GRPC,
			},
		]),
	],
	providers: [],
})
export class ClerkWebhooksModule {}
