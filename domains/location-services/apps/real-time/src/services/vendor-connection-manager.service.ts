import Redis from 'ioredis';
import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { retryOperation } from '@app/utils';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';

export interface VendorConnectionInfo {
	connectedAt: Date;
	socketId: string;
	vendorId: string;
}

interface VendorRoomMembership {
	vendorId: string;
	userId: string;
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
			this.logger.error('Failed to register vendor connection', error.stack, { error, socketId, vendorId });
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to register vendor connection', {
				socketId,
				vendorId,
			});
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
			this.logger.error('Failed to handle vendor disconnection', error.stack, { error, socketId });
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to handle vendor disconnection', {
				socketId,
			});
		}
	}

	/**
	 * Handle vendor disconnection with cleanup
	 * Domain method for vendor connection cleanup
	 */
	private async handleVendorDisconnect(vendorId: string, socketId: string): Promise<void> {
		this.logger.log('Cleaning up vendor connection', { socketId, vendorId });

		try {
			// Remove vendor from all rooms
			const vendorRooms = await this.redis.smembers(`vendor:${vendorId}:rooms`);
			for (const roomId of vendorRooms) {
				await this.redis.srem(`room:${roomId}:vendors`, vendorId);
			}

			// Clean up vendor mappings
			await this.redis.del(`vendor:${vendorId}:socketId`);
			await this.redis.del(`socket:${socketId}:vendorId`);
			await this.redis.del(`vendor:${vendorId}:rooms`);
			await this.redis.del(`vendor_connection:${socketId}`);

			this.logger.log('Vendor connection cleanup completed successfully', {
				roomsCleaned: vendorRooms.length,
				socketId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to cleanup vendor connection', error.stack, { error, socketId, vendorId });
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to cleanup vendor connection', {
				socketId,
				vendorId,
			});
		}
	}

	/**
	 * Get all users in a vendor room
	 * Domain method for vendor room membership retrieval
	 */
	async getVendorRoomUsers(vendorId: string): Promise<string[]> {
		this.logger.log('Getting vendor room users', { vendorId });

		try {
			const userIds = await this.redis.smembers(`room:${vendorId}:users`);

			this.logger.log('Vendor room users retrieved successfully', {
				userCount: userIds.length,
				vendorId,
			});

			return userIds;
		} catch (error) {
			this.logger.error('Failed to get vendor room users', error.stack, { error, vendorId });
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to get vendor room users', {
				vendorId,
			});
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

			const data = JSON.parse(connectionData);
			if (!data.socketId || !data.vendorId || !data.connectedAt) {
				throw AppError.validation('INVALID_INPUT', 'Invalid connection data structure', {
					socketId,
					data,
				});
			}

			return {
				socketId: data.socketId,
				vendorId: data.vendorId,
				connectedAt: new Date(data.connectedAt),
			};
		} catch (error) {
			this.logger.error('Failed to get connection info', error.stack, { error, socketId });
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to get vendor connection info', {
				socketId,
			});
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
			this.logger.error('Failed to get vendor socket ID', error.stack, { error, vendorId });
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to get vendor socket ID', {
				vendorId,
			});
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
			this.logger.error('Failed to get socket vendor ID', error.stack, { error, socketId });
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to get socket vendor ID', {
				socketId,
			});
		}
	}
}
