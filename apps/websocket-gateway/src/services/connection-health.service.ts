import Redis from 'ioredis';
import { IEventsService } from '@app/nest/modules';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';

export interface ConnectionMetrics {
	totalConnections: number;
	activeConnections: number;
	userConnections: number;
	vendorConnections: number;
	disconnectionsLastHour: number;
	errorsLastHour: number;
	avgConnectionDuration: number;
}

@Injectable()
export class ConnectionHealthService {
	private readonly logger = new Logger(ConnectionHealthService.name);

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly eventsService: IEventsService,
	) {}

	/**
	 * Record a new connection
	 */
	async recordConnection(socketId: string, userId?: string, vendorId?: string): Promise<void> {
		const timestamp = Date.now();
		const connectionKey = `connection:${socketId}`;
		const type = userId ? 'user' : 'vendor';

		try {
			// Store connection details
			await this.redis.hset(connectionKey, {
				socketId,
				userId: userId || '',
				vendorId: vendorId || '',
				type,
				connectedAt: timestamp,
				lastActivity: timestamp,
			});

			// Set expiry for connection tracking
			await this.redis.expire(connectionKey, 86400); // 24 hours

			// Update connection counters
			await this.redis.incr(`metrics:connections:${type}:total`);
			await this.redis.incr('metrics:connections:active');
			await this.redis.incr('metrics:connections:total');

			// Record connection event
			await this.recordEvent('connection', { socketId, userId, vendorId, type });

			this.logger.debug(`Connection recorded: ${socketId} (${type})`);
		} catch (error) {
			this.logger.error(`Failed to record connection for ${socketId}:`, error);
		}
	}

	/**
	 * Record a disconnection
	 */
	async recordDisconnection(socketId: string): Promise<void> {
		try {
			const connectionKey = `connection:${socketId}`;
			const connectionData = await this.redis.hgetall(connectionKey);

			if (connectionData.socketId) {
				const type = connectionData.type;
				const connectedAt = parseInt(connectionData.connectedAt);
				const duration = Date.now() - connectedAt;

				// Update disconnection counters
				await this.redis.incr(`metrics:disconnections:${type}:total`);
				await this.redis.incr('metrics:disconnections:total');
				await this.redis.decr('metrics:connections:active');

				// Record disconnection event
				await this.recordEvent('disconnection', {
					socketId,
					userId: connectionData.userId,
					vendorId: connectionData.vendorId,
					type,
					duration,
				});

				// Update average connection duration
				await this.updateAverageDuration(type, duration);

				// Clean up connection data
				await this.redis.del(connectionKey);

				this.logger.debug(`Disconnection recorded: ${socketId} (${type}) - Duration: ${duration}ms`);
			}
		} catch (error) {
			this.logger.error(`Failed to record disconnection for ${socketId}:`, error);
		}
	}

	/**
	 * Record an error
	 */
	async recordError(socketId: string, error: string, context?: any): Promise<void> {
		try {
			await this.redis.incr('metrics:errors:total');
			await this.redis.incr('metrics:errors:last_hour');

			// Record error event
			await this.recordEvent('error', {
				socketId,
				error,
				context,
				timestamp: Date.now(),
			});

			this.logger.debug(`Error recorded: ${socketId} - ${error}`);
		} catch (err) {
			this.logger.error(`Failed to record error for ${socketId}:`, err);
		}
	}

	/**
	 * Update last activity for a connection
	 */
	async updateActivity(socketId: string): Promise<void> {
		try {
			const connectionKey = `connection:${socketId}`;
			await this.redis.hset(connectionKey, 'lastActivity', Date.now());
		} catch (error) {
			this.logger.error(`Failed to update activity for ${socketId}:`, error);
		}
	}

	/**
	 * Get current connection metrics
	 */
	async getMetrics(): Promise<ConnectionMetrics> {
		try {
			const [
				totalConnections,
				activeConnections,
				userConnections,
				vendorConnections,
				disconnectionsLastHour,
				errorsLastHour,
				avgUserDuration,
				avgVendorDuration,
			] = await Promise.all([
				this.redis.get('metrics:connections:total'),
				this.redis.get('metrics:connections:active'),
				this.redis.get('metrics:connections:user:total'),
				this.redis.get('metrics:connections:vendor:total'),
				this.redis.get('metrics:disconnections:last_hour'),
				this.redis.get('metrics:errors:last_hour'),
				this.redis.get('metrics:avg_duration:user'),
				this.redis.get('metrics:avg_duration:vendor'),
			]);

			const avgConnectionDuration = 
				(parseInt(avgUserDuration || '0') + parseInt(avgVendorDuration || '0')) / 2;

			return {
				totalConnections: parseInt(totalConnections || '0'),
				activeConnections: parseInt(activeConnections || '0'),
				userConnections: parseInt(userConnections || '0'),
				vendorConnections: parseInt(vendorConnections || '0'),
				disconnectionsLastHour: parseInt(disconnectionsLastHour || '0'),
				errorsLastHour: parseInt(errorsLastHour || '0'),
				avgConnectionDuration: Math.round(avgConnectionDuration),
			};
		} catch (error) {
			this.logger.error('Failed to get connection metrics:', error);
			return {
				totalConnections: 0,
				activeConnections: 0,
				userConnections: 0,
				vendorConnections: 0,
				disconnectionsLastHour: 0,
				errorsLastHour: 0,
				avgConnectionDuration: 0,
			};
		}
	}

	/**
	 * Get active connections by type
	 */
	async getActiveConnections(type?: 'user' | 'vendor'): Promise<string[]> {
		try {
			const pattern = type ? `connection:*` : `connection:*`;
			const keys = await this.redis.keys(pattern);
			const connections: string[] = [];

			for (const key of keys) {
				const data = await this.redis.hgetall(key);
				if (data.socketId && (!type || data.type === type)) {
					connections.push(data.socketId);
				}
			}

			return connections;
		} catch (error) {
			this.logger.error('Failed to get active connections:', error);
			return [];
		}
	}

	/**
	 * Clean up old metrics
	 */
	async cleanupOldMetrics(): Promise<void> {
		try {
			// Reset hourly counters
			await this.redis.del('metrics:disconnections:last_hour');
			await this.redis.del('metrics:errors:last_hour');

			// Clean up old connection records (older than 24 hours)
			const oldConnections = await this.redis.keys('connection:*');
			for (const key of oldConnections) {
				const data = await this.redis.hgetall(key);
				const lastActivity = parseInt(data.lastActivity || '0');
				
				if (Date.now() - lastActivity > 86400000) { // 24 hours
					await this.redis.del(key);
				}
			}

			this.logger.debug('Old metrics cleaned up');
		} catch (error) {
			this.logger.error('Failed to cleanup old metrics:', error);
		}
	}

	private async recordEvent(type: string, data: any): Promise<void> {
		try {
			await this.eventsService.publishEvent(`websocket.${type}`, {
				...data,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			this.logger.error(`Failed to record ${type} event:`, error);
		}
	}

	private async updateAverageDuration(type: string, duration: number): Promise<void> {
		try {
			const key = `metrics:avg_duration:${type}`;
			const currentAvg = await this.redis.get(key);
			const currentCount = await this.redis.get(`metrics:connections:${type}:total`);

			if (currentAvg && currentCount) {
				const avg = parseInt(currentAvg);
				const count = parseInt(currentCount);
				const newAvg = Math.round((avg * (count - 1) + duration) / count);
				await this.redis.set(key, newAvg);
			} else {
				await this.redis.set(key, duration);
			}
		} catch (error) {
			this.logger.error(`Failed to update average duration for ${type}:`, error);
		}
	}
} 