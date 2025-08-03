import { EventsModule, GrpcLoggerModule, HealthModule, PrismaModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocationController } from './location.controller';

@Module({
	controllers: [LocationController],
	imports: [
		ConfigModule.forRoot(),
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'location-service',
		}),
		RedisModule,
		GrpcLoggerModule.register('Location Microservice'),
		PrismaModule.register(),
	],
	providers: [],
})
export class LocationModule {}
