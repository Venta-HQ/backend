import { BootstrapModule, EventsModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
	controllers: [LocationController],
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [RedisModule],
			appName: 'Location Microservice',
			protocol: 'grpc',
		}),
		EventsModule.register({ appName: 'Location Microservice' }),
	],
	providers: [LocationService],
})
export class LocationModule {}
