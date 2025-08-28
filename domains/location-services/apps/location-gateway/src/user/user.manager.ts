import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, RedisKeyService } from '@venta/nest/modules';

@Injectable()
export class UserConnectionManagerService {
	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly logger: Logger,
		private readonly redisKeys: RedisKeyService,
	) {
		this.logger.setContext(UserConnectionManagerService.name);
	}

	/**
	 * Clear all vendor room memberships for a user
	 */
	async clearUserVendorRooms(userId: string): Promise<void> {
		const key = this.redisKeys.buildKey('user', userId, 'vendor_rooms');
		await this.redis.del(key);
	}

	/**
	 * Get all vendor rooms a user is in
	 */
	async getUserVendorRooms(userId: string): Promise<string[]> {
		try {
			return this.redis.smembers(this.redisKeys.buildKey('user', userId, 'vendor_rooms'));
		} catch (error) {
			this.logger.error('Failed to get user vendor rooms', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_user_vendor_rooms',
			});
		}
	}

	/**
	 * Add user to vendor room
	 */
	async addUserToVendorRoom(userId: string, vendorId: string): Promise<void> {
		try {
			await this.redis.sadd(this.redisKeys.buildKey('user', userId, 'vendor_rooms'), vendorId);

			this.logger.debug('User added to vendor room', {
				userId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to add user to vendor room', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'add_user_to_vendor_room',
			});
		}
	}

	/**
	 * Remove user from vendor room
	 */
	async removeUserFromVendorRoom(userId: string, vendorId: string): Promise<void> {
		try {
			await this.redis.srem(this.redisKeys.buildKey('user', userId, 'vendor_rooms'), vendorId);

			this.logger.debug('User removed from vendor room', {
				userId,
				vendorId,
			});
		} catch (error) {
			this.logger.error('Failed to remove user from vendor room', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				vendorId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'remove_user_from_vendor_room',
			});
		}
	}

	// Disconnect handled by PresenceService
}
