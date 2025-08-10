import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';

@Injectable()
export class VendorConnectionManagerService {
	private readonly logger = new Logger(VendorConnectionManagerService.name);

	constructor(@InjectRedis() private readonly redis: Redis) {}

	/**
	 * Register a new vendor connection
	 */
	async registerVendor(socketId: string, vendorId: string): Promise<void> {
		try {
			// Store socket ID to vendor ID mapping
			await this.redis.set(`socket:${socketId}:vendor`, vendorId);

			// Add socket ID to vendor's socket set
			await this.redis.sadd(`vendor:${vendorId}:sockets`, socketId);

			this.logger.debug('Vendor connection registered', {
				socketId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to register vendor connection', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'register_vendor',
			});
		}
	}

	/**
	 * Get connection info for a socket
	 */
	async getConnectionInfo(socketId: string): Promise<{ vendorId: string } | null> {
		try {
			const vendorId = await this.redis.get(`socket:${socketId}:vendor`);
			if (!vendorId) {
				throw AppError.notFound(ErrorCodes.ERR_RESOURCE_NOT_FOUND, {
					resourceType: 'vendor_connection',
					resourceId: socketId,
					type: 'vendor',
					id: socketId,
				});
			}

			return { vendorId };
		} catch (error) {
			this.logger.error('Failed to get connection info', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_connection_info',
			});
		}
	}

	/**
	 * Get vendor ID for a socket
	 */
	async getSocketVendorId(socketId: string): Promise<string | null> {
		try {
			return this.redis.get(`socket:${socketId}:vendor`);
		} catch (error) {
			this.logger.error('Failed to get socket vendor ID', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_socket_vendor_id',
			});
		}
	}

	/**
	 * Get all users in a vendor room
	 */
	async getVendorRoomUsers(vendorId: string): Promise<string[]> {
		try {
			return this.redis.smembers(`vendor:${vendorId}:room_users`);
		} catch (error) {
			this.logger.error('Failed to get vendor room users', {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_vendor_room_users',
			});
		}
	}

	/**
	 * Handle vendor disconnect
	 */
	async handleVendorDisconnect(socketId: string, vendorId: string): Promise<void> {
		try {
			// Validate input
			if (!socketId || !vendorId) {
				throw AppError.validation(ErrorCodes.ERR_WEBSOCKET_ERROR, {
					operation: 'vendor_disconnect',
					message: 'Missing socket ID or vendor ID',
				});
			}

			// Remove socket ID from vendor's socket set
			await this.redis.srem(`vendor:${vendorId}:sockets`, socketId);

			// Remove socket ID to vendor ID mapping
			await this.redis.del(`socket:${socketId}:vendor`);

			this.logger.debug('Vendor disconnected', {
				socketId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to handle vendor disconnect', {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'handle_vendor_disconnect',
			});
		}
	}

	/**
	 * Get all sockets for a vendor
	 */
	async getVendorSockets(vendorId: string): Promise<string[]> {
		try {
			return this.redis.smembers(`vendor:${vendorId}:sockets`);
		} catch (error) {
			this.logger.error('Failed to get vendor sockets', {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_vendor_sockets',
			});
		}
	}

	/**
	 * Check if vendor is online
	 */
	async isVendorOnline(vendorId: string): Promise<boolean> {
		try {
			const sockets = await this.redis.smembers(`vendor:${vendorId}:sockets`);
			return sockets.length > 0;
		} catch (error) {
			this.logger.error('Failed to check if vendor is online', {
				error: error instanceof Error ? error.message : 'Unknown error',
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'is_vendor_online',
			});
		}
	}
}
