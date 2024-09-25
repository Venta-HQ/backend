import { LoggerModule, PrismaModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocationController } from './location.controller';

@Module({
	controllers: [LocationController],
	imports: [
		ConfigModule.forRoot(),
		RedisModule,
		LoggerModule.register('Location Microservice'),
		PrismaModule.register(),
	],
	providers: [],
})
export class LocationModule {}
