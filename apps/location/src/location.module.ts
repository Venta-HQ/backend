import { ErrorHandlingModule } from '@app/nest/errors';
import { ConfigModule, LoggerModule, PrismaModule, RedisModule } from '@app/nest/modules';
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
