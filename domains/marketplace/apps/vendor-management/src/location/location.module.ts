import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { VendorLocationEventsController } from './vendor-location-events.controller';

@Module({
	imports: [CoreModule],
	controllers: [VendorLocationEventsController],
})
export class LocationModule {}
