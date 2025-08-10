import { Module } from '@nestjs/common';
import { NatsQueueModule, PrismaModule } from '@venta/nest/modules';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
	imports: [PrismaModule, NatsQueueModule],
	controllers: [LocationController],
	providers: [LocationService],
	exports: [LocationService],
})
export class LocationModule {}
