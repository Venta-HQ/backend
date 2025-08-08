import Redis from 'ioredis';
import { AppError, ErrorCodes } from '@app/nest/errors';
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
			this.logger.error('Failed to register vendor connection', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
				vendorId,
			});
			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, {
				operation: 'register_vendor',
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
				throw AppError.notFound('VENDOR_NOT_FOUND', ErrorCodes.VENDOR_NOT_FOUND, {
					operation: 'handle_disconnect',
					socketId,
				});
			}

			await this.handleVendorDisconnect(connectionInfo.vendorId, socketId);
		} catch (error) {
			this.logger.error('Failed to handle vendor disconnection', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, {
				operation: 'handle_disconnect',
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
			this.logger.error('Failed to cleanup vendor connection', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
				vendorId,
			});
			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, {
				operation: 'handle_vendor_disconnect',
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
			this.logger.error('Failed to get vendor room users', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId,
			});
			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, {
				operation: 'get_vendor_room_users',
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
				throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
					operation: 'get_connection_info',
					socketId,
					message: 'Invalid connection data structure',
				});
			}

			return {
				socketId: data.socketId,
				vendorId: data.vendorId,
				connectedAt: new Date(data.connectedAt),
			};
		} catch (error) {
			this.logger.error('Failed to get connection info', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, {
				operation: 'get_connection_info',
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
			this.logger.error('Failed to get vendor socket ID', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId,
			});
			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, {
				operation: 'get_vendor_socket_id',
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
			this.logger.error('Failed to get socket vendor ID', error instanceof Error ? error.stack : '', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});
			throw AppError.internal('LOCATION_REDIS_OPERATION_FAILED', ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, {
				operation: 'get_socket_vendor_id',
				socketId,
			});
		}
	}
}
