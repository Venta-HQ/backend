import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, RedisKeyService } from '@venta/nest/modules';

@Injectable()
export class UserConnectionManagerService {
	private readonly SOCKET_TTL_SECONDS = 10 * 60; // 10 minutes

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly logger: Logger,
		private readonly configService: ConfigService,
		private readonly redisKeys: RedisKeyService,
	) {
		this.logger.setContext(UserConnectionManagerService.name);
	}

	/**
	 * Register a new user connection
	 */
	async registerUser(socketId: string, userId: string): Promise<void> {
		try {
			// Store socket<->user mappings with TTL (single-roundtrip using pipeline + SETEX)
			const socketKey = this.redisKeys.buildKey('socket', socketId, 'user');
			const userKey = this.redisKeys.buildKey('user', userId, 'socket');
			await this.redis
				.pipeline()
				.setex(socketKey, this.SOCKET_TTL_SECONDS, userId)
				.setex(userKey, this.SOCKET_TTL_SECONDS, socketId)
				.exec();

			this.logger.debug('User connection registered', {
				socketId,
				userId,
			});
		} catch (error) {
			this.logger.error('Failed to register user connection', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
				userId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'register_user',
			});
		}
	}

	/**
	 * Get connection info for a socket
	 */
	async getConnectionInfo(socketId: string): Promise<{ userId: string } | null> {
		try {
			const socketKey = this.redisKeys.buildKey('socket', socketId, 'user');
			const userId = await this.redis.get(socketKey);
			if (!userId) {
				throw AppError.notFound(ErrorCodes.ERR_RESOURCE_NOT_FOUND, {
					resourceType: 'user_connection',
					resourceId: socketId,
					type: 'user',
					id: socketId,
				});
			}

			// refresh TTLs on activity (pipeline both)
			const userKey = this.redisKeys.buildKey('user', userId, 'socket');
			await this.redis
				.pipeline()
				.expire(socketKey, this.SOCKET_TTL_SECONDS)
				.expire(userKey, this.SOCKET_TTL_SECONDS)
				.exec();
			return { userId };
		} catch (error) {
			this.logger.error('Failed to get connection info', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_connection_info',
			});
		}
	}

	/**
	 * Get user ID for a socket
	 */
	async getSocketUserId(socketId: string): Promise<string | null> {
		try {
			const socketKey = this.redisKeys.buildKey('socket', socketId, 'user');
			const userId = await this.redis.get(socketKey);
			if (userId) {
				const userKey = this.redisKeys.buildKey('user', userId, 'socket');
				await this.redis
					.pipeline()
					.expire(socketKey, this.SOCKET_TTL_SECONDS)
					.expire(userKey, this.SOCKET_TTL_SECONDS)
					.exec();
			}
			return userId;
		} catch (error) {
			this.logger.error('Failed to get socket user ID', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_socket_user_id',
			});
		}
	}

	/**
	 * Get all vendor rooms a user is in
	 */
	async getUserVendorRooms(userId: string): Promise<string[]> {
		try {
			return this.redis.smembers(this.redisKeys.buildKey('user', userId, 'vendor_rooms'));
		} catch (error) {
			this.logger.error('Failed to get user vendor rooms', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_user_vendor_rooms',
			});
		}
	}

	/**
	 * Add user to vendor room
	 */
	async addUserToVendorRoom(userId: string, vendorId: string): Promise<void> {
		try {
			await this.redis.sadd(this.redisKeys.buildKey('user', userId, 'vendor_rooms'), vendorId);

			this.logger.debug('User added to vendor room', {
				userId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to add user to vendor room', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'add_user_to_vendor_room',
			});
		}
	}

	/**
	 * Remove user from vendor room
	 */
	async removeUserFromVendorRoom(userId: string, vendorId: string): Promise<void> {
		try {
			await this.redis.srem(this.redisKeys.buildKey('user', userId, 'vendor_rooms'), vendorId);

			this.logger.debug('User removed from vendor room', {
				userId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to remove user from vendor room', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'remove_user_from_vendor_room',
			});
		}
	}

	/**
	 * Handle user disconnect
	 */
	async handleUserDisconnect(socketId: string, userId: string): Promise<void> {
		try {
			// Validate input
			if (!socketId || !userId) {
				throw AppError.validation(ErrorCodes.ERR_WEBSOCKET_ERROR, {
					operation: 'user_disconnect',
					message: 'Missing socket ID or user ID',
				});
			}

			// Remove socket ID from user's socket set
			const socketsSetKey = this.redisKeys.buildKey('user', userId, 'sockets');
			await this.redis.srem(socketsSetKey, socketId);

			// Remove socket ID to user ID mapping
			const socketKey = this.redisKeys.buildKey('socket', socketId, 'user');
			await this.redis.del(socketKey);

			this.logger.debug('User disconnected', {
				socketId,
				userId,
			});
		} catch (error) {
			this.logger.error('Failed to handle user disconnect', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
				userId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'handle_user_disconnect',
			});
		}
	}
}
