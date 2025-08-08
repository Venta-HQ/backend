import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module';
import { UserLocationEventsController } from './user-location-events.controller';

@Module({
	imports: [CoreModule],
	controllers: [UserLocationEventsController],
})
export class LocationModule {}
