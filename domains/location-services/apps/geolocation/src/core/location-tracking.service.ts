import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import type { LocationUpdate } from '@venta/domains/location-services/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';

@Injectable()
export class LocationTrackingService {
	constructor(
		@InjectRedis() private readonly redis: Redis,
		private readonly logger: Logger,
	) {
		this.logger.setContext(LocationTrackingService.name);
	}

	validateCoordinates(coordinates: { lat: number; lng: number }): boolean {
		return coordinates.lat >= -90 && coordinates.lat <= 90 && coordinates.lng >= -180 && coordinates.lng <= 180;
	}

	async updateVendorStatus(locationUpdate: LocationUpdate) {
		try {
			await this.redis.set(
				`${locationUpdate.entityType}:${locationUpdate.entityId}:status`,
				JSON.stringify({
					coordinates: locationUpdate.coordinates,
					lastUpdate: locationUpdate.timestamp,
					isActive: true,
				}),
			);
		} catch (error) {
			this.logger.error('Failed to update entity status', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				entityId: locationUpdate.entityId,
				entityType: locationUpdate.entityType,
			});

			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_entity_status',
				entityId: locationUpdate.entityId,
				entityType: locationUpdate.entityType,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	async getEntityStatus(
		entityId: string,
		entityType: 'user' | 'vendor',
	): Promise<{ isActive: boolean; lastUpdate: string }> {
		try {
			const status = await this.redis.get(`${entityType}:${entityId}:status`);
			if (!status) {
				return {
					isActive: false,
					lastUpdate: new Date(0).toISOString(),
				};
			}

			const parsedStatus = JSON.parse(status);

			// Check if last update was within 5 minutes
			const lastUpdate = new Date(parsedStatus.lastUpdate);
			const isActive = new Date().getTime() - lastUpdate.getTime() <= 5 * 60 * 1000;

			return {
				...parsedStatus,
				isActive,
			};
		} catch (error) {
			this.logger.error('Failed to get vendor status', error instanceof Error ? error.stack : undefined, {
				error: error instanceof Error ? error.message : 'Unknown error',
				entityId,
			});

			throw AppError.internal(ErrorCodes.ERR_REDIS_OPERATION_FAILED, {
				operation: 'get_vendor_status',
				entityId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}
}
