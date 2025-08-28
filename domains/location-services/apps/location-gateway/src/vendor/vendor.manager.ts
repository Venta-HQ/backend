import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, RedisKeyService } from '@venta/nest/modules';

@Injectable()
export class VendorConnectionManagerService {
	private readonly SOCKET_TTL_SECONDS = 10 * 60; // 10 minutes

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly logger: Logger,
		private readonly configService: ConfigService,
		private readonly redisKeys: RedisKeyService,
	) {
		this.logger.setContext(VendorConnectionManagerService.name);
	}

	/**
	 * Register a new vendor connection
	 */
	async registerVendor(socketId: string, vendorId: string): Promise<void> {
		try {
			// Store socket<->vendor mappings with TTL (single-roundtrip using pipeline + SETEX)
			const socketKey = this.redisKeys.buildKey('socket', socketId, 'vendor');
			const vendorKey = this.redisKeys.buildKey('vendor', vendorId, 'socket');
			await this.redis
				.pipeline()
				.setex(socketKey, this.SOCKET_TTL_SECONDS, vendorId)
				.setex(vendorKey, this.SOCKET_TTL_SECONDS, socketId)
				.exec();

			this.logger.debug('Vendor connection registered', {
				socketId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to register vendor connection', error instanceof Error ? error.stack : undefined, {
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
			const socketKey = this.redisKeys.buildKey('socket', socketId, 'vendor');
			const vendorId = await this.redis.get(socketKey);
			if (!vendorId) {
				throw AppError.notFound(ErrorCodes.ERR_RESOURCE_NOT_FOUND, {
					resourceType: 'vendor_connection',
					resourceId: socketId,
					type: 'vendor',
					id: socketId,
				});
			}

			// refresh TTLs on activity
			const vendorKey = this.redisKeys.buildKey('vendor', vendorId, 'socket');
			await this.redis
				.pipeline()
				.expire(socketKey, this.SOCKET_TTL_SECONDS)
				.expire(vendorKey, this.SOCKET_TTL_SECONDS)
				.exec();
			return { vendorId };
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
	 * Get vendor ID for a socket
	 */
	async getSocketVendorId(socketId: string): Promise<string | null> {
		try {
			const socketKey = this.redisKeys.buildKey('socket', socketId, 'vendor');
			const vendorId = await this.redis.get(socketKey);
			if (vendorId) {
				const vendorKey = this.redisKeys.buildKey('vendor', vendorId, 'socket');
				await this.redis
					.pipeline()
					.expire(socketKey, this.SOCKET_TTL_SECONDS)
					.expire(vendorKey, this.SOCKET_TTL_SECONDS)
					.exec();
			}
			return vendorId;
		} catch (error) {
			this.logger.error('Failed to get socket vendor ID', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_socket_vendor_id',
			});
		}
	}

	// Note: vendor room membership is managed on the user side via user.manager

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
			const socketsSetKey = this.redisKeys.buildKey('vendor', vendorId, 'sockets');
			await this.redis.srem(socketsSetKey, socketId);

			// Remove socket ID to vendor ID mapping
			const socketKey = this.redisKeys.buildKey('socket', socketId, 'vendor');
			await this.redis.del(socketKey);

			this.logger.debug('Vendor disconnected', {
				socketId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to handle vendor disconnect', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				socketId,
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'handle_vendor_disconnect',
			});
		}
	}
}
