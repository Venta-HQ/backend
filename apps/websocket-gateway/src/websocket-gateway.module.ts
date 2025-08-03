import { ConfigModule } from '@app/config';
import { ErrorHandlingModule } from '@app/errors';
import { EventsModule } from '@app/events';
import { HealthModule } from '@app/health';
import { LoggerModule } from '@app/logger';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { UserLocationGateway } from './gateways/user-location.gateway';
import { VendorLocationGateway } from './gateways/vendor-location.gateway';
import { ConnectionManagerService } from './services/connection-manager.service';

@Module({
	imports: [
		ConfigModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'websocket-gateway-service',
		}),
		LoggerModule.register({ appName: 'WebSocket Gateway', protocol: 'http' }),
		RedisModule,
		ErrorHandlingModule,
	],
	providers: [UserLocationGateway, VendorLocationGateway, ConnectionManagerService],
})
export class WebsocketGatewayModule {}
