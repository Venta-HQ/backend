import { APP_NAMES, BootstrapModule, EventsModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
	controllers: [LocationController],
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [RedisModule],
			appName: APP_NAMES.LOCATION,
			protocol: 'grpc',
		}),
		EventsModule.register(), // No longer needs appName parameter
	],
	providers: [LocationService],
})
export class LocationModule {}
