import { RedisModule } from '@app/nest/modules';
import { LocationContractsModule } from '@domains/location-services/contracts/location-contracts.module';
import { Module } from '@nestjs/common';
import { GeolocationController } from './geolocation.controller';
import { GeolocationService } from './geolocation.service';
import { LocationTrackingService } from './location-tracking.service';

@Module({
	imports: [LocationContractsModule, RedisModule],
	controllers: [GeolocationController],
	providers: [GeolocationService, LocationTrackingService],
	exports: [GeolocationService, LocationTrackingService],
})
export class CoreModule {}
