import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisService extends Redis {
	constructor(@InjectRedis() redis: Redis) {
		// Call the parent Redis constructor with the existing connection's options
		super(redis.options);
	}

	/**
	 * Build a Redis key with proper prefixing
	 */
	buildKey(...parts: (string | number)[]): string {
		return parts.join(':');
	}
}
