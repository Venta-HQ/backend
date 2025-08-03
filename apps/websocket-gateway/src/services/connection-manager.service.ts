import Redis from 'ioredis';
import { IEventsService } from '@app/nest/modules';
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
			// Store user -> socket mapping
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
			// Store vendor -> socket mapping
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
	 * Handle client disconnection
	 * @param socketId Socket ID
	 */
	async handleDisconnect(socketId: string): Promise<void> {
		try {
			const connectionInfo = await this.getConnectionInfo(socketId);
			if (!connectionInfo) {
				return;
			}

			if (connectionInfo.vendorId) {
				await this.handleVendorDisconnect(connectionInfo.vendorId, socketId);
			} else if (connectionInfo.userId) {
				await this.handleUserDisconnect(connectionInfo.userId, socketId);
			}

			// Clean up connection info
			await this.redis.del(`connection:${socketId}`);
		} catch (error) {
			this.logger.error(`Failed to handle disconnect for socket ${socketId}:`, error);
		}
	}

	/**
	 * Handle user disconnection
	 * @param userId User ID
	 * @param socketId Socket ID
	 */
	private async handleUserDisconnect(userId: string, socketId: string): Promise<void> {
		try {
			// Remove user from all vendor rooms
			const rooms = await this.redis.smembers(`user:${userId}:room`);
			for (const room of rooms) {
				await this.redis.srem(`room:${room}:users`, userId);
			}

			// Clean up user mappings
			await this.redis.del(`user:${userId}:socketId`);
			await this.redis.del(`user:${userId}:room`);
			await this.redis.del(`socket:${socketId}:userId`);

			// Emit disconnection event
			await this.eventsService.publishEvent('websocket.user.disconnected', {
				userId,
				socketId,
				timestamp: new Date().toISOString(),
			});

			this.logger.log(`User ${userId} disconnected from socket ${socketId}`);
		} catch (error) {
			this.logger.error(`Failed to handle user disconnect ${userId}:`, error);
		}
	}

	/**
	 * Handle vendor disconnection
	 * @param vendorId Vendor ID
	 * @param socketId Socket ID
	 */
	private async handleVendorDisconnect(vendorId: string, socketId: string): Promise<void> {
		try {
			// Remove vendor from location tracking
			await this.redis.zrem('vendor_locations', vendorId);

			// Get all users in vendor's room
			const usersInRoom = await this.redis.smembers(`room:${vendorId}:users`);

			// Clean up vendor mappings
			await this.redis.del(`vendor:${vendorId}:socketId`);
			await this.redis.del(`socket:${socketId}:vendorId`);
			await this.redis.del(`room:${vendorId}:users`);

			// Remove vendor from all users' room lists
			for (const userId of usersInRoom) {
				await this.redis.srem(`user:${userId}:room`, vendorId);
			}

			// Emit disconnection event
			await this.eventsService.publishEvent('websocket.vendor.disconnected', {
				vendorId,
				socketId,
				usersInRoom,
				timestamp: new Date().toISOString(),
			});

			this.logger.log(`Vendor ${vendorId} disconnected from socket ${socketId}`);
		} catch (error) {
			this.logger.error(`Failed to handle vendor disconnect ${vendorId}:`, error);
		}
	}

	/**
	 * Add user to vendor room
	 * @param userId User ID
	 * @param vendorId Vendor ID
	 */
	async addUserToVendorRoom(userId: string, vendorId: string): Promise<void> {
		await this.redis.sadd(`room:${vendorId}:users`, userId);
		await this.redis.sadd(`user:${userId}:room`, vendorId);
	}

	/**
	 * Remove user from vendor room
	 * @param userId User ID
	 * @param vendorId Vendor ID
	 */
	async removeUserFromVendorRoom(userId: string, vendorId: string): Promise<void> {
		await this.redis.srem(`room:${vendorId}:users`, userId);
		await this.redis.srem(`user:${userId}:room`, vendorId);
	}

	/**
	 * Get user's vendor rooms
	 * @param userId User ID
	 */
	async getUserVendorRooms(userId: string): Promise<string[]> {
		return await this.redis.smembers(`user:${userId}:room`);
	}

	/**
	 * Get vendor room users
	 * @param vendorId Vendor ID
	 */
	async getVendorRoomUsers(vendorId: string): Promise<string[]> {
		return await this.redis.smembers(`room:${vendorId}:users`);
	}

	/**
	 * Get connection info for socket
	 * @param socketId Socket ID
	 */
	async getConnectionInfo(socketId: string): Promise<ConnectionInfo | null> {
		const connectionData = await this.redis.get(`connection:${socketId}`);
		if (!connectionData) {
			return null;
		}
		return JSON.parse(connectionData);
	}

	/**
	 * Get user's socket ID
	 * @param userId User ID
	 */
	async getUserSocketId(userId: string): Promise<string | null> {
		return await this.redis.get(`user:${userId}:socketId`);
	}

	/**
	 * Get vendor's socket ID
	 * @param vendorId Vendor ID
	 */
	async getVendorSocketId(vendorId: string): Promise<string | null> {
		return await this.redis.get(`vendor:${vendorId}:socketId`);
	}

	/**
	 * Get socket's user ID
	 * @param socketId Socket ID
	 */
	async getSocketUserId(socketId: string): Promise<string | null> {
		return await this.redis.get(`socket:${socketId}:userId`);
	}

	/**
	 * Get socket's vendor ID
	 * @param socketId Socket ID
	 */
	async getSocketVendorId(socketId: string): Promise<string | null> {
		return await this.redis.get(`socket:${socketId}:vendorId`);
	}
} 