import Redis from 'ioredis';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { retryOperation } from '@app/utils';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';

export interface UserConnectionInfo {
	connectedAt: Date;
	socketId: string;
	userId: string;
}

interface UserRoomMembership {
	userId: string;
	vendorId: string;
}

@Injectable()
export class UserConnectionManagerService {
	private readonly logger = new Logger(UserConnectionManagerService.name);

	constructor(@InjectRedis() private readonly redis: Redis) {}

	/**
	 * Register a user connection for location-based updates
	 * Domain method for user connection management
	 */
	async registerUser(userId: string, socketId: string): Promise<void> {
		this.logger.log('Registering user connection for location updates', { socketId, userId });

		try {
			// Store user -> socket mapping with retry
			await retryOperation(
				async () => {
					await this.redis.set(`user:${userId}:socketId`, socketId);
					await this.redis.set(`socket:${socketId}:userId`, userId);
					await this.redis.set(
						`user_connection:${socketId}`,
						JSON.stringify({
							connectedAt: new Date().toISOString(),
							socketId,
							userId,
						}),
					);
				},
				'Register user connection in Redis',
				{ logger: this.logger },
			);

			this.logger.log('User connection registered successfully', { socketId, userId });
		} catch (error) {
			this.logger.error('Failed to register user connection', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
				userId,
			});
			throw AppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, {
				operation: 'register_user',
				socketId,
				userId,
			});
		}
	}

	/**
	 * Handle user disconnection
	 * Domain method for user connection cleanup
	 */
	async handleDisconnect(socketId: string): Promise<void> {
		this.logger.log('Handling user disconnection', { socketId });

		try {
			const connectionInfo = await this.getConnectionInfo(socketId);
			if (!connectionInfo) {
				throw AppError.notFound(ErrorCodes.ERR_RESOURCE_NOT_FOUND, {
					type: 'connection',
					id: socketId,
				});
			}

			await this.handleUserDisconnect(connectionInfo.userId, socketId);
		} catch (error) {
			this.logger.error('Failed to handle user disconnection', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, {
				operation: 'handle_disconnect',
				socketId,
			});
		}
	}

	/**
	 * Handle user disconnection with cleanup
	 * Domain method for user connection cleanup
	 */
	private async handleUserDisconnect(userId: string, socketId: string): Promise<void> {
		this.logger.log('Cleaning up user connection', { socketId, userId });

		try {
			// Remove user from all rooms
			const userRooms = await this.redis.smembers(`user:${userId}:rooms`);
			for (const roomId of userRooms) {
				await this.redis.srem(`room:${roomId}:users`, userId);
			}

			// Clean up user mappings
			await this.redis.del(`user:${userId}:socketId`);
			await this.redis.del(`socket:${socketId}:userId`);
			await this.redis.del(`user:${userId}:rooms`);
			await this.redis.del(`user_connection:${socketId}`);

			this.logger.log('User connection cleanup completed successfully', {
				roomsCleaned: userRooms.length,
				socketId,
				userId,
			});
		} catch (error) {
			this.logger.error('Failed to cleanup user connection', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
				userId,
			});
			throw AppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, {
				operation: 'handle_user_disconnect',
				socketId,
				userId,
			});
		}
	}

	/**
	 * Add user to a vendor room for location updates
	 * Domain method for user-vendor room membership
	 */
	async addUserToVendorRoom(membership: UserRoomMembership): Promise<void> {
		this.logger.log('Adding user to vendor room for location updates', {
			userId: membership.userId,
			vendorId: membership.vendorId,
		});

		try {
			await this.redis.sadd(`user:${membership.userId}:rooms`, membership.vendorId);
			await this.redis.sadd(`room:${membership.vendorId}:users`, membership.userId);

			this.logger.log('User added to vendor room successfully', {
				userId: membership.userId,
				vendorId: membership.vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to add user to vendor room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: membership.userId,
				vendorId: membership.vendorId,
			});
			throw AppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, {
				operation: 'add_user_to_vendor_room',
				userId: membership.userId,
				vendorId: membership.vendorId,
			});
		}
	}

	/**
	 * Remove user from a vendor room
	 * Domain method for user-vendor room membership cleanup
	 */
	async removeUserFromVendorRoom(membership: UserRoomMembership): Promise<void> {
		this.logger.log('Removing user from vendor room', {
			userId: membership.userId,
			vendorId: membership.vendorId,
		});

		try {
			await this.redis.srem(`user:${membership.userId}:rooms`, membership.vendorId);
			await this.redis.srem(`room:${membership.vendorId}:users`, membership.userId);

			this.logger.log('User removed from vendor room successfully', {
				userId: membership.userId,
				vendorId: membership.vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to remove user from vendor room', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId: membership.userId,
				vendorId: membership.vendorId,
			});
			throw AppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, {
				operation: 'remove_user_from_vendor_room',
				userId: membership.userId,
				vendorId: membership.vendorId,
			});
		}
	}

	/**
	 * Get all vendor rooms for a user
	 * Domain method for user room membership retrieval
	 */
	async getUserVendorRooms(userId: string): Promise<string[]> {
		this.logger.log('Getting user vendor room memberships', { userId });

		try {
			const vendorRooms = await this.redis.smembers(`user:${userId}:rooms`);

			this.logger.log('User vendor room memberships retrieved successfully', {
				userId,
				vendorCount: vendorRooms.length,
			});

			return vendorRooms;
		} catch (error) {
			this.logger.error('Failed to get user vendor room memberships', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw AppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, {
				operation: 'get_user_vendor_rooms',
				userId,
			});
		}
	}

	/**
	 * Get connection info for a user socket
	 * Domain method for connection info retrieval
	 */
	async getConnectionInfo(socketId: string): Promise<UserConnectionInfo | null> {
		try {
			const connectionData = await this.redis.get(`user_connection:${socketId}`);
			if (!connectionData) {
				return null;
			}

			const parsed = JSON.parse(connectionData);
			if (!parsed || typeof parsed !== 'object' || !('userId' in parsed)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_FORMAT, {
					field: 'connection_data',
					message: 'Invalid connection data structure',
				});
			}

			return parsed;
		} catch (error) {
			this.logger.error('Failed to get connection info', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, {
				operation: 'get_connection_info',
				socketId,
			});
		}
	}

	/**
	 * Get socket ID for a user
	 * Domain method for user socket mapping retrieval
	 */
	async getUserSocketId(userId: string): Promise<string | null> {
		try {
			return await this.redis.get(`user:${userId}:socketId`);
		} catch (error) {
			this.logger.error('Failed to get user socket ID', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw AppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, {
				operation: 'get_user_socket_id',
				userId,
			});
		}
	}

	/**
	 * Get user ID for a socket
	 * Domain method for socket user mapping retrieval
	 */
	async getSocketUserId(socketId: string): Promise<string | null> {
		try {
			return await this.redis.get(`socket:${socketId}:userId`);
		} catch (error) {
			this.logger.error('Failed to get socket user ID', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});
			throw AppError.internal(ErrorCodes.ERR_LOC_REDIS_FAILED, {
				operation: 'get_socket_user_id',
				socketId,
			});
		}
	}
}
