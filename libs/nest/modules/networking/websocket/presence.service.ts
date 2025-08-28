import type Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, RedisKeyService } from '@venta/nest/modules';

type PresenceKind = 'user' | 'vendor';

@Injectable()
export class PresenceService {
	private readonly ttlSeconds: number;

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly keys: RedisKeyService,
		private readonly logger: Logger,
		@Optional() private readonly config?: ConfigService,
	) {
		this.logger.setContext(PresenceService.name);
		const defaultTtl = 10 * 60; // 10 minutes
		const configured = this.config?.get<number>('WS_PRESENCE_TTL_SECONDS');
		this.ttlSeconds = configured && configured > 0 ? configured : defaultTtl;
	}

	async register(kind: PresenceKind, socketId: string, entityId: string): Promise<void> {
		const socketKey = this.keys.buildKey('socket', socketId, kind);
		const entityKey = this.keys.buildKey(kind, entityId, 'socket');
		await this.redis
			.pipeline()
			.setex(socketKey, this.ttlSeconds, entityId)
			.setex(entityKey, this.ttlSeconds, socketId)
			.exec();
	}

	async lookup(kind: PresenceKind, socketId: string): Promise<string | null> {
		const socketKey = this.keys.buildKey('socket', socketId, kind);
		return (await this.redis.get(socketKey)) as string | null;
	}

	async reverseLookup(kind: PresenceKind, entityId: string): Promise<string | null> {
		const entityKey = this.keys.buildKey(kind, entityId, 'socket');
		return (await this.redis.get(entityKey)) as string | null;
	}

	async touch(kind: PresenceKind, socketId: string, entityId: string): Promise<void> {
		const socketKey = this.keys.buildKey('socket', socketId, kind);
		const entityKey = this.keys.buildKey(kind, entityId, 'socket');
		const results = await this.redis
			.pipeline()
			.expire(socketKey, this.ttlSeconds)
			.expire(entityKey, this.ttlSeconds)
			.exec();
		const ok = Array.isArray(results) && results.every(([, v]) => v === 1);
		if (!ok) {
			await this.redis
				.pipeline()
				.setex(socketKey, this.ttlSeconds, entityId)
				.setex(entityKey, this.ttlSeconds, socketId)
				.exec();
		}
	}

	async disconnect(kind: PresenceKind, socketId: string, _entityId: string): Promise<void> {
		const socketKey = this.keys.buildKey('socket', socketId, kind);
		await this.redis.del(socketKey);
	}
}
