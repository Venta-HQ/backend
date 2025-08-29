import { RedisModule as BaseRedisModule } from '@nestjs-modules/ioredis';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
	exports: [BaseRedisModule, RedisService],
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
	providers: [RedisService],
})
export class RedisModule {}
