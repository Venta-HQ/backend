import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/database';
import { ErrorHandlingModule } from '@app/errors';
import { EventsModule } from '@app/events';
import { HealthModule } from '@app/health';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
	controllers: [LocationController],
	imports: [
		ConfigModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'location-service',
		}),
		LoggerModule.register({ appName: 'Location Microservice', protocol: 'grpc' }),
		PrismaModule.register(),
		ErrorHandlingModule,
	],
	providers: [LocationService],
})
export class LocationModule {}
