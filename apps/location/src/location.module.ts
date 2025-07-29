import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/database';
import { ErrorHandlingModule } from '@app/errors';
import { LoggerModule } from '@app/logger';
import { RedisModule } from '@app/redis';
import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

@Module({
	controllers: [LocationController],
	imports: [
		ConfigModule,
		LoggerModule.register({ appName: 'Location Microservice', protocol: 'grpc' }),
		PrismaModule.register(),
		RedisModule,
		ErrorHandlingModule,
	],
	providers: [LocationService],
})
export class LocationModule {}
