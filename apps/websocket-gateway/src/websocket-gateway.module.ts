import { join } from 'path';
import { ConfigModule, EventsModule, GrpcInstanceModule, LoggerModule, PrismaModule } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME, LOCATION_SERVICE_NAME, LocationServiceClient } from '@app/proto/location';
import { Module } from '@nestjs/common';
import { LocationGateway } from './gateways/location.gateway';

@Module({
	imports: [
		ConfigModule,
		EventsModule,
		LoggerModule.register({ appName: 'WebSocket Gateway', protocol: 'ws' }),
		PrismaModule.register(),
		GrpcInstanceModule.register<LocationServiceClient>({
			protoPackage: LOCATION_PACKAGE_NAME,
			protoPath: join(__dirname, `../../libs/proto/src/definitions/location.proto`),
			provide: LOCATION_SERVICE_NAME,
			serviceName: LOCATION_SERVICE_NAME,
			urlEnvVar: 'LOCATION_SERVICE_ADDRESS',
		}),
	],
	controllers: [],
	providers: [LocationGateway],
})
export class WebsocketGatewayModule {}
