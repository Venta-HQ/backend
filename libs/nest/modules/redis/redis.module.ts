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
			}),
		}),
	],
})
export class RedisModule {}
