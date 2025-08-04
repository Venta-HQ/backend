import { EventsModule, HealthModule, LoggerModule, PrismaModule, RedisModule } from '@app/nest/modules';
import { ErrorHandlingModule } from '@app/nest/errors';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
	controllers: [LocationController],
	imports: [
		ConfigModule.forRoot(),
		ErrorHandlingModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'location-service',
		}),
		RedisModule,
		LoggerModule.register({ appName: 'Location Microservice', protocol: 'grpc' }),
		PrismaModule.register(),
	],
	providers: [LocationService],
})
export class LocationModule {}
