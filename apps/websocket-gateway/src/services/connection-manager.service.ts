import Redis from 'ioredis';
import { IEventsService } from '@app/events';
import { RetryUtil } from '@app/utils';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';

export interface ConnectionInfo {
	userId?: string;
	vendorId?: string;
	socketId: string;
	connectedAt: Date;
}

@Injectable()
export class ConnectionManagerService {
	private readonly logger = new Logger(ConnectionManagerService.name);
	private readonly retryUtil: RetryUtil;

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly eventsService: IEventsService,
	) {
		this.retryUtil = new RetryUtil({
			maxRetries: 3,
			retryDelay: 1000,
			backoffMultiplier: 2,
			logger: this.logger,
		});
	}

	/**
	 * Register a user connection for location-based updates
	 * @param userId User ID
	 * @param socketId Socket ID
	 */
	async registerUser(userId: string, socketId: string): Promise<void> {
		try {
			// Store user -> socket mapping with retry
			await this.retryUtil.retryOperation(
				async () => {
					await this.redis.set(`user:${userId}:socketId`, socketId);
					await this.redis.set(`socket:${socketId}:userId`, userId);
					await this.redis.set(
						`connection:${socketId}`,
						JSON.stringify({
							userId,
							socketId,
							connectedAt: new Date().toISOString(),
						}),
					);
				},
				'Register user connection in Redis'
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
	 * Register a vendor connection for location updates
	 * @param vendorId Vendor ID
	 * @param socketId Socket ID
	 */
	async registerVendor(vendorId: string, socketId: string): Promise<void> {
		try {
			// Store vendor -> socket mapping with retry
			await this.retryUtil.retryOperation(
				async () => {
					await this.redis.set(`vendor:${vendorId}:socketId`, socketId);
					await this.redis.set(`socket:${socketId}:vendorId`, vendorId);
					await this.redis.set(
						`connection:${socketId}`,
						JSON.stringify({
							vendorId,
							socketId,
							connectedAt: new Date().toISOString(),
						}),
					);
				},
				'Register vendor connection in Redis'
			);

			// Emit connection event
			await this.eventsService.publishEvent('websocket.vendor.connected', {
				vendorId,
				socketId,
				timestamp: new Date().toISOString(),
			});

			this.logger.log(`Vendor ${vendorId} connected with socket ${socketId}`);
		} catch (error) {
			this.logger.error(`Failed to register vendor ${vendorId}:`, error);
			throw error;
		}
	}

	/**
	 * Handle socket disconnection
	 * @param socketId Socket ID
	 */
	async handleDisconnect(socketId: string): Promise<void> {
		try {
			const connectionInfo = await this.getConnectionInfo(socketId);
			if (!connectionInfo) {
				this.logger.warn(`No connection info found for socket ${socketId}`);
				return;
			}

			if (connectionInfo.userId) {
				await this.handleUserDisconnect(connectionInfo.userId, socketId);
			} else if (connectionInfo.vendorId) {
				await this.handleVendorDisconnect(connectionInfo.vendorId, socketId);
			}

			// Clean up connection info
			await this.redis.del(`connection:${socketId}`);
		} catch (error) {
			this.logger.error(`Failed to handle disconnect for socket ${socketId}:`, error);
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

		// Emit disconnection event
		await this.eventsService.publishEvent('websocket.user.disconnected', {
			userId,
			socketId,
			timestamp: new Date().toISOString(),
		});

		this.logger.log(`User ${userId} disconnected from socket ${socketId}`);
	}

	/**
	 * Handle vendor disconnection
	 * @param vendorId Vendor ID
	 * @param socketId Socket ID
	 */
	private async handleVendorDisconnect(vendorId: string, socketId: string): Promise<void> {
		// Get all users in vendor's room
		const usersInRoom = await this.redis.smembers(`room:${vendorId}:users`);

		// Remove vendor from geolocation store
		await this.redis.zrem('vendor_locations', vendorId);

		// Clean up vendor mappings
		await this.redis.del(`vendor:${vendorId}:socketId`);
		await this.redis.del(`socket:${socketId}:vendorId`);
		await this.redis.del(`room:${vendorId}:users`);

		// Remove vendor from all users' room lists
		for (const userId of usersInRoom) {
			await this.redis.srem(`user:${userId}:rooms`, vendorId);
		}

		// Emit disconnection event
		await this.eventsService.publishEvent('websocket.vendor.disconnected', {
			vendorId,
			socketId,
			affectedUsers: usersInRoom,
			timestamp: new Date().toISOString(),
		});

		this.logger.log(`Vendor ${vendorId} disconnected from socket ${socketId}, affecting ${usersInRoom.length} users`);
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
	 * Get all users in a vendor room
	 * @param vendorId Vendor ID
	 * @returns Array of user IDs
	 */
	async getVendorRoomUsers(vendorId: string): Promise<string[]> {
		return await this.redis.smembers(`room:${vendorId}:users`);
	}

	/**
	 * Get connection info for a socket
	 * @param socketId Socket ID
	 * @returns Connection info or null
	 */
	async getConnectionInfo(socketId: string): Promise<ConnectionInfo | null> {
		const connectionData = await this.redis.get(`connection:${socketId}`);
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
	 * Get socket ID for a vendor
	 * @param vendorId Vendor ID
	 * @returns Socket ID or null
	 */
	async getVendorSocketId(vendorId: string): Promise<string | null> {
		return await this.redis.get(`vendor:${vendorId}:socketId`);
	}

	/**
	 * Get user ID for a socket
	 * @param socketId Socket ID
	 * @returns User ID or null
	 */
	async getSocketUserId(socketId: string): Promise<string | null> {
		return await this.redis.get(`socket:${socketId}:userId`);
	}

	/**
	 * Get vendor ID for a socket
	 * @param socketId Socket ID
	 * @returns Vendor ID or null
	 */
	async getSocketVendorId(socketId: string): Promise<string | null> {
		return await this.redis.get(`socket:${socketId}:vendorId`);
	}
}
