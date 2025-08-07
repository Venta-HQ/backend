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
	 * Domain method for vendor connection management
	 */
	async registerVendor(vendorId: string, socketId: string): Promise<void> {
		this.logger.log('Registering vendor connection for location updates', { socketId, vendorId });

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

			this.logger.log('Vendor connection registered successfully', { socketId, vendorId });
		} catch (error) {
			this.logger.error('Failed to register vendor connection', { error, socketId, vendorId });
			throw error;
		}
	}

	/**
	 * Handle vendor disconnection
	 * Domain method for vendor connection cleanup
	 */
	async handleDisconnect(socketId: string): Promise<void> {
		this.logger.log('Handling vendor disconnection', { socketId });

		try {
			const connectionInfo = await this.getConnectionInfo(socketId);
			if (!connectionInfo) {
				this.logger.warn('No vendor connection info found for disconnection', { socketId });
				return;
			}

			await this.handleVendorDisconnect(connectionInfo.vendorId, socketId);
		} catch (error) {
			this.logger.error('Failed to handle vendor disconnection', { error, socketId });
			throw error;
		}
	}

	/**
	 * Handle vendor disconnection with cleanup
	 * Domain method for vendor connection cleanup
	 */
	private async handleVendorDisconnect(vendorId: string, socketId: string): Promise<void> {
		this.logger.log('Cleaning up vendor connection', { socketId, vendorId });

		try {
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

			this.logger.log('Vendor connection cleanup completed successfully', {
				socketId,
				usersAffected: usersInRoom.length,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to cleanup vendor connection', { error, socketId, vendorId });
			throw error;
		}
	}

	/**
	 * Get all users in a vendor room
	 * Domain method for vendor room membership retrieval
	 */
	async getVendorRoomUsers(vendorId: string): Promise<string[]> {
		this.logger.log('Getting vendor room user memberships', { vendorId });

		try {
			const usersInRoom = await this.redis.smembers(`room:${vendorId}:users`);

			this.logger.log('Vendor room user memberships retrieved successfully', {
				userCount: usersInRoom.length,
				vendorId,
			});

			return usersInRoom;
		} catch (error) {
			this.logger.error('Failed to get vendor room user memberships', { error, vendorId });
			throw error;
		}
	}

	/**
	 * Get connection info for a vendor socket
	 * Domain method for connection info retrieval
	 */
	async getConnectionInfo(socketId: string): Promise<VendorConnectionInfo | null> {
		try {
			const connectionData = await this.redis.get(`vendor_connection:${socketId}`);
			if (!connectionData) {
				return null;
			}
			return JSON.parse(connectionData);
		} catch (error) {
			this.logger.error('Failed to get vendor connection info', { error, socketId });
			throw error;
		}
	}

	/**
	 * Get socket ID for a vendor
	 * Domain method for vendor socket mapping retrieval
	 */
	async getVendorSocketId(vendorId: string): Promise<string | null> {
		try {
			return await this.redis.get(`vendor:${vendorId}:socketId`);
		} catch (error) {
			this.logger.error('Failed to get vendor socket ID', { error, vendorId });
			throw error;
		}
	}

	/**
	 * Get vendor ID for a socket
	 * Domain method for socket vendor mapping retrieval
	 */
	async getSocketVendorId(socketId: string): Promise<string | null> {
		try {
			return await this.redis.get(`socket:${socketId}:vendorId`);
		} catch (error) {
			this.logger.error('Failed to get socket vendor ID', { error, socketId });
			throw error;
		}
	}
}
