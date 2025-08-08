import { Module } from '@nestjs/common';
import { GeolocationController } from './geolocation.controller';
import { GeolocationService } from './geolocation.service';
import { LocationTrackingService } from './location-tracking.service';

@Module({
	controllers: [GeolocationController],
	providers: [GeolocationService, LocationTrackingService],
	exports: [GeolocationService, LocationTrackingService],
})
export class CoreModule {}
