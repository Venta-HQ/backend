import Redis from 'ioredis';
import { retryOperation } from '@app/utils';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';

export interface VendorConnectionInfo {
	connectedAt: Date;
	socketId: string;
	vendorId: string;
}

@Injectable()
export class VendorConnectionManagerService {
	private readonly logger = new Logger(VendorConnectionManagerService.name);

	constructor(@InjectRedis() private readonly redis: Redis) {}

	/**
	 * Register a vendor connection for location updates
	 * @param vendorId Vendor ID
	 * @param socketId Socket ID
	 */
	async registerVendor(vendorId: string, socketId: string): Promise<void> {
		try {
			// Store vendor -> socket mapping with retry
			await retryOperation(
				async () => {
					await this.redis.set(`vendor:${vendorId}:socketId`, socketId);
					await this.redis.set(`socket:${socketId}:vendorId`, vendorId);
					await this.redis.set(
						`vendor_connection:${socketId}`,
						JSON.stringify({
							connectedAt: new Date().toISOString(),
							socketId,
							vendorId,
						}),
					);
				},
				'Register vendor connection in Redis',
				{ logger: this.logger },
			);



			this.logger.log(`Vendor ${vendorId} connected with socket ${socketId}`);
		} catch (error) {
			this.logger.error(`Failed to register vendor ${vendorId}:`, error);
			throw error;
		}
	}

	/**
	 * Handle vendor disconnection
	 * @param socketId Socket ID
	 */
	async handleDisconnect(socketId: string): Promise<void> {
		try {
			const connectionInfo = await this.getConnectionInfo(socketId);
			if (!connectionInfo) {
				this.logger.warn(`No vendor connection info found for socket ${socketId}`);
				return;
			}

			await this.handleVendorDisconnect(connectionInfo.vendorId, socketId);
		} catch (error) {
			this.logger.error(`Failed to handle vendor disconnect for socket ${socketId}:`, error);
			throw error;
		}
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
		await this.redis.del(`vendor_connection:${socketId}`);

		// Remove vendor from all users' room lists
		for (const userId of usersInRoom) {
			await this.redis.srem(`user:${userId}:rooms`, vendorId);
		}



		this.logger.log(`Vendor ${vendorId} disconnected from socket ${socketId}, affecting ${usersInRoom.length} users`);
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
	 * Get connection info for a vendor socket
	 * @param socketId Socket ID
	 * @returns Connection info or null
	 */
	async getConnectionInfo(socketId: string): Promise<VendorConnectionInfo | null> {
		const connectionData = await this.redis.get(`vendor_connection:${socketId}`);
		if (!connectionData) {
			return null;
		}
		return JSON.parse(connectionData);
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
	 * Get vendor ID for a socket
	 * @param socketId Socket ID
	 * @returns Vendor ID or null
	 */
	async getSocketVendorId(socketId: string): Promise<string | null> {
		return await this.redis.get(`socket:${socketId}:vendorId`);
	}
}
