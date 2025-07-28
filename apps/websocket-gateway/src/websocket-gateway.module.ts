import { join } from 'path';
import { ErrorHandlingModule } from '@app/nest/errors';
import { HttpLoggerModule, RedisModule } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME, LOCATION_SERVICE_NAME } from '@app/proto/location';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LocationWebsocketGateway } from './gateways/location.gateway';

@Module({
	imports: [
		ConfigModule.forRoot(),
		RedisModule,
		HttpLoggerModule.register('Websocket Gateway Microservice'),
		ErrorHandlingModule,
		ClientsModule.registerAsync({
			clients: [
				{
					imports: [ConfigModule],
					inject: [ConfigService],
					name: LOCATION_SERVICE_NAME,
					useFactory: (configService: ConfigService) => ({
						options: {
							package: LOCATION_PACKAGE_NAME,
							protoPath: join(__dirname, `../proto/src/definitions/location.proto`),
							url: configService.get('LOCATION_SERVICE_ADDRESS'),
						},
						transport: Transport.GRPC,
					}),
				},
			],
		}),
	],
	providers: [LocationWebsocketGateway],
})
export class WebsocketGatewayModule {}
