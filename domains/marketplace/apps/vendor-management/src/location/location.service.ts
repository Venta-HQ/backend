import { Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { PrismaService } from '@venta/nest/modules';

@Injectable()
export class LocationService {
	private readonly logger = new Logger(LocationService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Update vendor location from event data
	 * Used by location event handlers
	 */
	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void> {
		this.logger.log('Updating vendor location from event', {
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

			this.logger.log('Vendor location updated from event successfully', {
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
