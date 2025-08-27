import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';

@Injectable()
export class UserConnectionManagerService {
	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly logger: Logger,
	) {
		this.logger.setContext(UserConnectionManagerService.name);
	}

	/**
	 * Register a new user connection
	 */
	async registerUser(socketId: string, userId: string): Promise<void> {
		try {
			// Store socket ID to user ID mapping
			await this.redis.set(`socket:${socketId}:user`, userId);

			// Store user ID to socket ID mapping
			await this.redis.set(`user:${userId}:socket`, socketId);

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
			const userId = await this.redis.get(`socket:${socketId}:user`);
			if (!userId) {
				throw AppError.notFound(ErrorCodes.ERR_RESOURCE_NOT_FOUND, {
					resourceType: 'user_connection',
					resourceId: socketId,
					type: 'user',
					id: socketId,
				});
			}

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
			return this.redis.get(`socket:${socketId}:user`);
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
			return this.redis.smembers(`user:${userId}:vendor_rooms`);
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
			await this.redis.sadd(`user:${userId}:vendor_rooms`, vendorId);

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
			await this.redis.srem(`user:${userId}:vendor_rooms`, vendorId);

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
			await this.redis.srem(`user:${userId}:sockets`, socketId);

			// Remove socket ID to user ID mapping
			await this.redis.del(`socket:${socketId}:user`);

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

	/**
	 * Get all sockets for a user
	 */
	async getUserSockets(userId: string): Promise<string[]> {
		try {
			return this.redis.smembers(`user:${userId}:sockets`);
		} catch (error) {
			this.logger.error('Failed to get user sockets', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_user_sockets',
			});
		}
	}

	/**
	 * Check if user is in vendor room
	 */
	async isUserInVendorRoom(userId: string, vendorId: string): Promise<boolean> {
		try {
			return (await this.redis.sismember(`user:${userId}:vendor_rooms`, vendorId)) === 1;
		} catch (error) {
			this.logger.error('Failed to check if user is in vendor room', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'is_user_in_vendor_room',
			});
		}
	}
}
