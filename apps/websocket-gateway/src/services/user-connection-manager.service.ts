import Redis from 'ioredis';
import { IEventsService } from '@app/nest/modules';
import { retryOperation } from '@app/utils';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';

export interface UserConnectionInfo {
	userId: string;
	socketId: string;
	connectedAt: Date;
}

@Injectable()
export class UserConnectionManagerService {
	private readonly logger = new Logger(UserConnectionManagerService.name);

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly eventsService: IEventsService,
	) {}

	/**
	 * Register a user connection for location-based updates
	 * @param userId User ID
	 * @param socketId Socket ID
	 */
	async registerUser(userId: string, socketId: string): Promise<void> {
		try {
			// Store user -> socket mapping with retry
			await retryOperation(
				async () => {
					await this.redis.set(`user:${userId}:socketId`, socketId);
					await this.redis.set(`socket:${socketId}:userId`, userId);
					await this.redis.set(
						`user_connection:${socketId}`,
						JSON.stringify({
							userId,
							socketId,
							connectedAt: new Date().toISOString(),
						}),
					);
				},
				'Register user connection in Redis',
				{ logger: this.logger },
			);

			// Emit connection event
			await this.eventsService.publishEvent('websocket.user.connected', {
				userId,
				socketId,
				timestamp: new Date().toISOString(),
			});

			this.logger.log(`User ${userId} connected with socket ${socketId}`);
		} catch (error) {
			this.logger.error(`Failed to register user ${userId}:`, error);
			throw error;
		}
	}

	/**
	 * Handle user disconnection
	 * @param socketId Socket ID
	 */
	async handleDisconnect(socketId: string): Promise<void> {
		try {
			const connectionInfo = await this.getConnectionInfo(socketId);
			if (!connectionInfo) {
				this.logger.warn(`No user connection info found for socket ${socketId}`);
				return;
			}

			await this.handleUserDisconnect(connectionInfo.userId, socketId);
		} catch (error) {
			this.logger.error(`Failed to handle user disconnect for socket ${socketId}:`, error);
			throw error;
		}
	}

	/**
	 * Handle user disconnection
	 * @param userId User ID
	 * @param socketId Socket ID
	 */
	private async handleUserDisconnect(userId: string, socketId: string): Promise<void> {
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

		// Emit disconnection event
		await this.eventsService.publishEvent('websocket.user.disconnected', {
			userId,
			socketId,
			timestamp: new Date().toISOString(),
		});

		this.logger.log(`User ${userId} disconnected from socket ${socketId}`);
	}

	/**
	 * Add user to a vendor room for location updates
	 * @param userId User ID
	 * @param vendorId Vendor ID (room ID)
	 */
	async addUserToVendorRoom(userId: string, vendorId: string): Promise<void> {
		await this.redis.sadd(`user:${userId}:rooms`, vendorId);
		await this.redis.sadd(`room:${vendorId}:users`, userId);
		this.logger.debug(`User ${userId} added to vendor room ${vendorId}`);
	}

	/**
	 * Remove user from a vendor room
	 * @param userId User ID
	 * @param vendorId Vendor ID (room ID)
	 */
	async removeUserFromVendorRoom(userId: string, vendorId: string): Promise<void> {
		await this.redis.srem(`user:${userId}:rooms`, vendorId);
		await this.redis.srem(`room:${vendorId}:users`, userId);
		this.logger.debug(`User ${userId} removed from vendor room ${vendorId}`);
	}

	/**
	 * Get all vendor rooms for a user
	 * @param userId User ID
	 * @returns Array of vendor IDs
	 */
	async getUserVendorRooms(userId: string): Promise<string[]> {
		return await this.redis.smembers(`user:${userId}:rooms`);
	}

	/**
	 * Get connection info for a user socket
	 * @param socketId Socket ID
	 * @returns Connection info or null
	 */
	async getConnectionInfo(socketId: string): Promise<UserConnectionInfo | null> {
		const connectionData = await this.redis.get(`user_connection:${socketId}`);
		if (!connectionData) {
			return null;
		}
		return JSON.parse(connectionData);
	}

	/**
	 * Get socket ID for a user
	 * @param userId User ID
	 * @returns Socket ID or null
	 */
	async getUserSocketId(userId: string): Promise<string | null> {
		return await this.redis.get(`user:${userId}:socketId`);
	}

	/**
	 * Get user ID for a socket
	 * @param socketId Socket ID
	 * @returns User ID or null
	 */
	async getSocketUserId(socketId: string): Promise<string | null> {
		return await this.redis.get(`socket:${socketId}:userId`);
	}
} 