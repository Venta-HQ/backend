import { join } from 'path';
import { USER_PACKAGE_NAME, USER_SERVICE_NAME } from '@app/proto/user';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SubscriptionWebhooksController } from './subscription-webhooks.controller';

@Module({
	controllers: [SubscriptionWebhooksController],
	imports: [
		ClientsModule.registerAsync({
			clients: [
				{
					imports: [ConfigModule],
					inject: [ConfigService],
					name: USER_SERVICE_NAME,
					useFactory: (configService: ConfigService) => ({
						options: {
							package: USER_PACKAGE_NAME,
							protoPath: join(__dirname, `../proto/src/definitions/user.proto`),
							url: configService.get('USER_SERVICE_ADDRESS'),
						},
						transport: Transport.GRPC,
					}),
				},
			],
		}),
	],
	providers: [],
})
export class SubscriptionWebhooksModule {}
