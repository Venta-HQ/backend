import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../../core/logger';
import { RedisModule } from '../../data/redis';
import { PresenceService } from './presence.service';

@Module({
	imports: [ConfigModule, LoggerModule, RedisModule],
	providers: [PresenceService],
	exports: [PresenceService],
})
export class WebSocketModule {}
