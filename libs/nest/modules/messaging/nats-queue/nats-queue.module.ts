import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NatsQueueService } from './nats-queue.service';

@Module({
	exports: [NatsQueueService],
	imports: [ConfigModule],
	providers: [NatsQueueService],
})
export class NatsQueueModule {}
