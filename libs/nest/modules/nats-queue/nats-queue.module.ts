import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NatsQueueService } from './nats-queue.service';

@Module({
	imports: [ConfigModule],
	providers: [NatsQueueService],
	exports: [NatsQueueService],
})
export class NatsQueueModule {} 