import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { LocationServices } from '@venta/domains/location-services/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';

@Injectable()
export class LocationTrackingService {
	private readonly logger = new Logger(LocationTrackingService.name);

	constructor(@InjectRedis() private readonly redis: Redis) {}

	validateCoordinates(coordinates: LocationServices.Core.Coordinates): boolean {
		return coordinates.lat >= -90 && coordinates.lat <= 90 && coordinates.lng >= -180 && coordinates.lng <= 180;
	}

	async updateVendorStatus(
		entityId: string,
		data: {
			coordinates: LocationServices.Core.Coordinates;
			timestamp: string;
		},
	) {
		try {
			await this.redis.set(
				`vendor:${entityId}:status`,
				JSON.stringify({
					coordinates: data.coordinates,
					lastUpdate: data.timestamp,
					isActive: true,
				}),
			);
		} catch (error) {
			this.logger.error('Failed to update vendor status', {
				error: error instanceof Error ? error.message : 'Unknown error',
				entityId,
			});

			throw AppError.internal(ErrorCodes.ERR_EVENT_OPERATION_FAILED, {
				operation: 'update_vendor_status',
				entityId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	async getVendorStatus(entityId: string): Promise<{ isActive: boolean; lastUpdate: string }> {
		try {
			const status = await this.redis.get(`vendor:${entityId}:status`);
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
			this.logger.error('Failed to get vendor status', {
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
