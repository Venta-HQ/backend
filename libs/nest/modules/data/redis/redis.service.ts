import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NamespacedRedisService {
	private readonly prefix: string;

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly config: ConfigService,
	) {
		const env = this.config.get<string>('NODE_ENV') || 'development';
		const ns = this.config.get<string>('REDIS_NAMESPACE') || 'locgw';
		this.prefix = `${env}:${ns}:`;
	}

	buildKey(...parts: string[]): string {
		return this.prefix + parts.join(':');
	}

	setEx(parts: string[], ttlSeconds: number, value: string): Promise<'OK'> {
		const key = this.buildKey(...parts);
		return this.redis.setex(key, ttlSeconds, value);
	}

	get(parts: string[]): Promise<string | null> {
		return this.redis.get(this.buildKey(...parts));
	}

	expireMany(partsList: string[][], ttlSeconds: number): Promise<any> {
		const pipeline = this.redis.pipeline();
		for (const parts of partsList) {
			pipeline.expire(this.buildKey(...parts), ttlSeconds);
		}
		return pipeline.exec();
	}

	pipeline(): ReturnType<Redis['pipeline']> {
		return this.redis.pipeline();
	}
}
