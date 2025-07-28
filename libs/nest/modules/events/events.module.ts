import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { EventsService } from './events.service';

@Global()
@Module({
	exports: [EventsService],
	imports: [RedisModule],
	providers: [EventsService],
})
export class EventsModule {}
