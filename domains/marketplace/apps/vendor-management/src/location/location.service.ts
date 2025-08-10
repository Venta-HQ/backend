import { Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { EventService, PrismaService } from '@venta/nest/modules';
import { VendorLocationUpdate } from '@venta/proto/marketplace/vendor-management';

@Injectable()
export class LocationService {
	private readonly logger = new Logger(LocationService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
	) {}

	/**
	 * Update vendor location
	 * Domain method for vendor location management
	 */
	async updateVendorLocation(data: VendorLocationUpdate): Promise<void> {
		this.logger.log('Updating vendor location', {
			location: `${data.coordinates?.lat}, ${data.coordinates?.long}`,
			vendorId: data.vendorId,
		});

		try {
			// Validate location coordinates
			if (!data.coordinates?.lat || !data.coordinates?.long) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					field: 'coordinates',
					message: 'Valid lat/long coordinates are required',
				});
			}

			// Update vendor location
			const updatedVendor = await this.prisma.db.vendor.update({
				where: { id: data.vendorId },
				data: {
					lat: data.coordinates.lat,
					long: data.coordinates.long,
				},
			});

			this.logger.log('Vendor location updated successfully', {
				location: `${data.coordinates?.lat}, ${data.coordinates?.long}`,
				vendorId: data.vendorId,
			});

			// Emit location updated event
			await this.eventService.emit('location.vendor.location_updated', {
				vendorId: updatedVendor.id,
				location: {
					lat: updatedVendor.lat || 0,
					lng: updatedVendor.long || 0,
				},
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', error.stack, {
				error,
				location: data.coordinates,
				vendorId: data.vendorId,
			});
			throw AppError.internal(ErrorCodes.ERR_OPERATION_FAILED, {
				operation: 'update_vendor_location',
				vendorId: data.vendorId,
				coordinates: data.coordinates,
			});
		}
	}

	/**
	 * Update vendor location from event data
	 * Used by location event handlers
	 */
	async updateVendorLocationFromEvent(vendorId: string, location: { lat: number; lng: number }): Promise<void> {
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
					long: location.lng,
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
