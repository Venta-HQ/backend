import { BootstrapModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
	controllers: [LocationController],
	imports: [
		BootstrapModule.forRoot({
			appName: 'Location Microservice',
			protocol: 'grpc',
			additionalModules: [RedisModule],
		}),
	],
	providers: [LocationService],
})
export class LocationModule {}
