import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/database';
import { ErrorHandlingModule } from '@app/errors';
import { LoggerModule } from '@app/logger';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';

@Module({
	controllers: [LocationController],
	imports: [
		ConfigModule,
		LoggerModule.register({ appName: 'Location Microservice', protocol: 'grpc' }),
		PrismaModule.register(),
		RedisModule,
		ErrorHandlingModule,
	],
})
export class LocationModule {}
