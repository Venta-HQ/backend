import { ConfigModule, GrpcLoggerModule, PrismaModule, RedisModule } from '@app/nest/modules';
import { ErrorHandlingModule } from '@app/nest/errors';
import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';

@Module({
	controllers: [LocationController],
	imports: [ConfigModule, GrpcLoggerModule.register('Location Microservice'), PrismaModule.register(), RedisModule, ErrorHandlingModule],
})
export class LocationModule {}
