import { APP_NAMES, BootstrapModule, EventsModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { LocationContractsModule } from '../../../contracts/location-contracts.module';
import { LocationTrackingService } from './location-tracking.service';
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
		LocationContractsModule,
	],
	providers: [LocationService, LocationTrackingService],
})
export class LocationModule {}
