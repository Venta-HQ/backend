import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, RedisService } from '@venta/nest/modules';

type PresenceKind = 'user' | 'vendor';

export interface PresenceUpdate {
	entityId: string;
	coordinates: {
		lat: number;
		lng: number;
	};
}

@Injectable()
export class PresenceService {
	/**
	 * TTL for presence records in Redis, in seconds.
	 * Configurable via WS_PRESENCE_TTL_SECONDS (defaults to 600s / 10m).
	 */
	private readonly ttlSeconds: number;

	/**
	 * Minimum interval between TTL refreshes (touch) for the same socket, in ms.
	 * Configurable via WS_PRESENCE_REFRESH_MIN_MS (defaults to 30_000ms / 30s).
	 */
	private readonly minRefreshMs: number;

	/**
	 * In-memory debounce map tracking the last touch timestamp per socket.
	 * Key: `${kind}:${socketId}`; Value: epoch millis of the last successful touch.
	 */
	private readonly lastTouchMs = new Map<string, number>();

	constructor(
		private readonly redis: RedisService,
		private readonly logger: Logger,
		@Optional() private readonly config?: ConfigService,
	) {
		this.logger.setContext(PresenceService.name);
		const defaultTtl = 10 * 60; // 10 minutes
		const configured = this.config?.get<number>('WS_PRESENCE_TTL_SECONDS');
		this.ttlSeconds = configured && configured > 0 ? configured : defaultTtl;
		const configuredRefresh = this.config?.get<number>('WS_PRESENCE_REFRESH_MIN_MS');
		this.minRefreshMs = configuredRefresh && configuredRefresh > 0 ? configuredRefresh : 30_000; // 30s
	}

	/**
	 * Register a new socket presence mapping with TTL in Redis.
	 * Creates both:
	 *  - socket:{socketId}:{kind} -> entityId
	 *  - {kind}:{entityId}:socket -> socketId
	 * Also records the last touch time for local rate limiting.
	 */
	async register(kind: PresenceKind, socketId: string, entityId: string): Promise<void> {
		const socketKey = this.redis.buildKey('socket', socketId, kind);
		const entityKey = this.redis.buildKey(kind, entityId, 'socket');
		await this.redis
			.pipeline()
			.setex(socketKey, this.ttlSeconds, entityId)
			.setex(entityKey, this.ttlSeconds, socketId)
			.exec();
		this.lastTouchMs.set(`${kind}:${socketId}`, Date.now());
	}

	/**
	 * Lookup the entityId for a given socketId without affecting TTL.
	 * Returns null if the mapping does not exist or is expired.
	 */
	async lookup(kind: PresenceKind, socketId: string): Promise<string | null> {
		const socketKey = this.redis.buildKey('socket', socketId, kind);
		return (await this.redis.get(socketKey)) as string | null;
	}

	/**
	 * Reverse lookup the socketId for a given entityId without affecting TTL.
	 * Returns null if the mapping does not exist or is expired.
	 */
	async reverseLookup(kind: PresenceKind, entityId: string): Promise<string | null> {
		const entityKey = this.redis.buildKey(kind, entityId, 'socket');
		return (await this.redis.get(entityKey)) as string | null;
	}

	/**
	 * Refresh (touch) the socket→entity TTL, with per-socket rate limiting.
	 * If the socket key is missing, re-register both mappings to restore presence.
	 * This avoids redundant Redis calls on every message while keeping presence fresh.
	 */
	async touch(kind: PresenceKind, socketId: string, entityId: string): Promise<void> {
		const keyId = `${kind}:${socketId}`;
		const now = Date.now();
		const last = this.lastTouchMs.get(keyId) ?? 0;
		if (now - last < this.minRefreshMs) return;

		const socketKey = this.redis.buildKey('socket', socketId, kind);
		const results = await this.redis.pipeline().expire(socketKey, this.ttlSeconds).exec();
		const ok = Array.isArray(results) && results[0] && results[0][1] === 1;
		if (!ok) {
			// Key missing or expired; reuse register to restore mappings and last-touch
			await this.register(kind, socketId, entityId);
			return;
		}

		this.lastTouchMs.set(keyId, now);
	}

	/**
	 * Remove the socket→entity mapping for a disconnecting socket
	 * and clear the local last-touch book keeping.
	 */
	async disconnect(kind: PresenceKind, socketId: string, _entityId: string): Promise<void> {
		const socketKey = this.redis.buildKey('socket', socketId, kind);
		await this.redis.del(socketKey);
		this.lastTouchMs.delete(`${kind}:${socketId}`);
	}
}
