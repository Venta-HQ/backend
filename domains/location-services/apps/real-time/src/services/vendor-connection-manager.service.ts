import Redis from 'ioredis';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { WebSocketACL } from '../anti-corruption-layers/websocket-acl';
import { RealTime } from '../types/context-mapping.types';

/**
 * Service for managing vendor WebSocket connections
 */
@Injectable()
export class VendorConnectionManagerService {
	private readonly logger = new Logger(VendorConnectionManagerService.name);

	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly websocketACL: WebSocketACL,
	) {}

	/**
	 * Register a vendor connection for location updates
	 */
	async registerVendor(vendorId: string, socketId: string): Promise<void> {
		this.logger.debug('Processing vendor registration', {
			socketId,
			vendorId,
		});

		try {
			// Create connection record
			const connection: RealTime.Core.ClientConnection = {
				id: socketId,
				userId: vendorId,
				connectedAt: new Date().toISOString(),
				subscriptions: [],
				metadata: {
					type: 'vendor',
					vendorId,
				},
			};

			// Store connection mappings
			await this.redis
				.multi()
				.set(`vendor:${vendorId}:socketId`, socketId)
				.set(`socket:${socketId}:vendorId`, vendorId)
				.set(`vendor_connection:${socketId}`, JSON.stringify(connection))
				.exec();

			this.logger.debug('Vendor registration completed', {
				socketId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to register vendor', {
				error: error.message,
				socketId,
				vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to register vendor connection');
		}
	}

	/**
	 * Handle vendor disconnection
	 */
	async handleDisconnect(socketId: string): Promise<void> {
		this.logger.debug('Processing vendor disconnection', { socketId });

		try {
			const connection = await this.getConnectionInfo(socketId);
			if (!connection) {
				this.logger.warn('No vendor connection found for disconnection', { socketId });
				return;
			}

			await this.handleVendorDisconnect(connection.userId, socketId);
		} catch (error) {
			this.logger.error('Failed to handle vendor disconnection', {
				error: error.message,
				socketId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to handle vendor disconnection');
		}
	}

	/**
	 * Handle vendor disconnection with cleanup
	 */
	private async handleVendorDisconnect(vendorId: string, socketId: string): Promise<void> {
		this.logger.debug('Cleaning up vendor connection', {
			socketId,
			vendorId,
		});

		try {
			// Get all users in vendor's room
			const usersInRoom = await this.redis.smembers(`room:${vendorId}:users`);

			// Clean up all vendor data
			await this.redis
				.multi()
				.zrem('vendor_locations', vendorId)
				.del(`vendor:${vendorId}:socketId`)
				.del(`socket:${socketId}:vendorId`)
				.del(`room:${vendorId}:users`)
				.del(`vendor_connection:${socketId}`)
				.exec();

			// Remove vendor from all users' room lists
			if (usersInRoom.length > 0) {
				const pipeline = this.redis.pipeline();
				for (const userId of usersInRoom) {
					pipeline.srem(`user:${userId}:rooms`, vendorId);
				}
				await pipeline.exec();
			}

			this.logger.debug('Vendor connection cleanup completed', {
				socketId,
				usersAffected: usersInRoom.length,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to cleanup vendor connection', {
				error: error.message,
				socketId,
				vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to cleanup vendor connection');
		}
	}

	/**
	 * Get all users in a vendor room
	 */
	async getVendorRoomUsers(vendorId: string): Promise<string[]> {
		this.logger.debug('Retrieving vendor room users', { vendorId });

		try {
			const usersInRoom = await this.redis.smembers(`room:${vendorId}:users`);

			this.logger.debug('Retrieved vendor room users', {
				userCount: usersInRoom.length,
				vendorId,
			});

			return usersInRoom;
		} catch (error) {
			this.logger.error('Failed to get vendor room users', {
				error: error.message,
				vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to get vendor room users');
		}
	}

	/**
	 * Get connection info for a vendor socket
	 */
	async getConnectionInfo(socketId: string): Promise<RealTime.Core.ClientConnection | null> {
		try {
			const connectionData = await this.redis.get(`vendor_connection:${socketId}`);
			if (!connectionData) {
				return null;
			}

			const connection = JSON.parse(connectionData);
			const parsed = RealTime.Validation.ClientConnectionSchema.safeParse(connection);
			if (!parsed.success) {
				throw new Error('Invalid connection data structure');
			}

			return connection;
		} catch (error) {
			this.logger.error('Failed to get vendor connection info', {
				error: error.message,
				socketId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to get vendor connection info');
		}
	}

	/**
	 * Get socket ID for a vendor
	 */
	async getVendorSocketId(vendorId: string): Promise<string | null> {
		try {
			return await this.redis.get(`vendor:${vendorId}:socketId`);
		} catch (error) {
			this.logger.error('Failed to get vendor socket ID', {
				error: error.message,
				vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to get vendor socket ID');
		}
	}

	/**
	 * Get vendor ID for a socket
	 */
	async getSocketVendorId(socketId: string): Promise<string | null> {
		try {
			return await this.redis.get(`socket:${socketId}:vendorId`);
		} catch (error) {
			this.logger.error('Failed to get socket vendor ID', {
				error: error.message,
				socketId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal('REDIS_OPERATION_FAILED', 'Failed to get socket vendor ID');
		}
	}
}
