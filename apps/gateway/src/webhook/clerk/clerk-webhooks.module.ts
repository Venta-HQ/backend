import { Module } from '@nestjs/common';
import { ClerkWebhooksController } from './clerk-webhooks.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE_NAME } from '@app/proto/auth';
import { join } from 'path';

@Module({
	controllers: [ClerkWebhooksController],
	imports: [
		ClientsModule.register([
			{ 
				name: AUTH_SERVICE_NAME, 
				transport: Transport.GRPC, 
				options: {
					package: 'auth',
					protoPath: join(__dirname, `../proto/src/definitions/auth.proto`),
				},
			},
		]),
	],
	providers: [],
})
export class ClerkWebhooksModule {}
