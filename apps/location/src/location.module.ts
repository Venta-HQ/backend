import { LoggerModule } from '@app/nest/modules/logger';
import { RedisModule } from '@app/nest/modules/redis';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocationController } from './location.controller';

@Module({
	controllers: [LocationController],
	imports: [ConfigModule.forRoot(), RedisModule, LoggerModule.register('Location Microservice')],
	providers: [],
})
export class LocationModule {}
