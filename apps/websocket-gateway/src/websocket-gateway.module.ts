import { join } from 'path';
import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/database';
import { EventsModule } from '@app/events';
import { GrpcInstanceModule } from '@app/grpc';
import { LoggerModule } from '@app/logger';
import { LOCATION_PACKAGE_NAME, LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { LocationWebsocketGateway } from './gateways/location.gateway';

@Module({
	imports: [
		ConfigModule,
		EventsModule,
		LoggerModule.register({ appName: 'WebSocket Gateway', protocol: 'http' }),
		PrismaModule.register(),
		RedisModule,
		GrpcInstanceModule.register<LocationServiceClient>({
			protoPackage: LOCATION_PACKAGE_NAME,
			protoPath: join(__dirname, `../../libs/proto/src/definitions/location.proto`),
			provide: LOCATION_SERVICE_NAME,
			serviceName: LOCATION_SERVICE_NAME,
			urlEnvVar: 'LOCATION_SERVICE_ADDRESS',
		}),
	],
	controllers: [],
	providers: [LocationWebsocketGateway],
})
export class WebsocketGatewayModule {}
