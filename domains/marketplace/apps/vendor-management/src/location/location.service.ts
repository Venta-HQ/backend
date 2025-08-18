import { Injectable } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger, PrismaService } from '@venta/nest/modules';

@Injectable()
export class LocationService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(LocationService.name);
	}

	/**
	 * Update vendor location from event data
	 * Used by location event handlers
	 */
	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void> {
		this.logger.debug('Updating vendor location from event', {
			vendorId,
			location: `${location.lat}, ${location.lng}`,
		});

		try {
			// Update vendor location
			await this.prisma.db.vendor.update({
				where: { id: vendorId },
				data: {
					lat: location.lat,
					lng: location.lng,
				},
			});

			this.logger.debug('Vendor location updated from event successfully', {
				vendorId,
				location: `${location.lat}, ${location.lng}`,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location from event', error.stack, {
				error,
				vendorId,
				location,
			});
			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_vendor_database',
				vendorId,
				location,
			});
		}
	}
}
