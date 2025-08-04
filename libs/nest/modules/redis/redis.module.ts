import { RedisModule as BaseRedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
	imports: [
		BaseRedisModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				type: 'single',
				url: configService.get('REDIS_URL'),
				password: configService.get('REDIS_PASSWORD'),
				retryDelayOnFailover: 100,
				maxRetriesPerRequest: 3,
			}),
		}),
	],
	exports: [BaseRedisModule],
})
export class RedisModule {}
