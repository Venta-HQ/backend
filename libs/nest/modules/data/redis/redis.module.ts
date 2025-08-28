import { RedisModule as BaseRedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisKeyService } from './redis.service';

@Module({
	exports: [BaseRedisModule, RedisKeyService],
	imports: [
		BaseRedisModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				maxRetriesPerRequest: 3,
				password: configService.get('REDIS_PASSWORD'),
				retryDelayOnFailover: 100,
				type: 'single',
				url: configService.get('REDIS_URL'),
			}),
		}),
	],
	providers: [RedisKeyService],
})
export class RedisModule {}
