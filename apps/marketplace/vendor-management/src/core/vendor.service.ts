import { AppError, ErrorCodes } from '@app/nest/errors';
import { EventService, PrismaService } from '@app/nest/modules';
import { VendorCreateData, VendorUpdateData } from '@app/proto/marketplace/vendor-management';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VendorService {
	constructor(
		private prisma: PrismaService,
		private eventService: EventService,
	) {}
	private readonly logger = new Logger(VendorService.name);

	async getVendorById(id: string) {
		const vendor = await this.prisma.db.vendor.findFirst({
			where: { id },
		});
		return vendor;
	}

	async createVendor(data: VendorCreateData) {
		this.logger.log('Creating new vendor');
		const { imageUrl, userId, ...rest } = data;
		const vendor = await this.prisma.db.vendor.create({
			data: {
				...rest,
				ownerId: userId,
				primaryImage: imageUrl,
			},
		});
		await this.eventService.emit('vendor.created', vendor);
		return vendor.id;
	}

	async updateVendor(id: string, userId: string, data: Omit<VendorUpdateData, 'id' | 'userId'>) {
		const exists = await this.prisma.db.vendor.count({
			where: { id, ownerId: userId },
		});

		if (!exists) {
			throw AppError.notFound(ErrorCodes.VENDOR_NOT_FOUND, { vendorId: id });
		}

		const { imageUrl, ...updateData } = data;

		const vendor = await this.prisma.db.vendor.update({
			data: {
				...updateData,
				...(imageUrl ? { primaryImage: imageUrl } : {}),
			},
			where: { id, ownerId: userId },
		});

		await this.eventService.emit('vendor.updated', vendor);
	}

	async deleteVendor(id: string, userId: string) {
		const vendor = await this.prisma.db.vendor.findFirst({
			where: { id, ownerId: userId },
		});
		if (!vendor) {
			throw AppError.notFound(ErrorCodes.VENDOR_NOT_FOUND, { vendorId: id });
		}
		await this.prisma.db.vendor.delete({
			where: { id },
		});
		await this.eventService.emit('vendor.deleted', vendor);
	}

	/**
	 * Update vendor location from location service events
	 * This method is called when the location service publishes a vendor.location.updated event
	 * It doesn't require user authorization since it's a system-level operation
	 */
	async updateVendorLocation(vendorId: string, location: { lat: number; long: number }) {
		this.logger.log(`Updating vendor location from location service: ${vendorId}`);

		try {
			// Update vendor location in database
			const vendor = await this.prisma.db.vendor.update({
				data: {
					lat: location.lat,
					long: location.long,
				},
				where: {
					id: vendorId,
				},
			});

			// Publish vendor updated event for other services (like search-discovery)
			await this.eventService.emit('vendor.updated', vendor);

			this.logger.log(`Updated vendor location in database: ${vendorId} at (${location.lat}, ${location.long})`);
		} catch (e) {
			this.logger.error(`Failed to update vendor location in database for ${vendorId}:`, e);
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update vendor location in database' });
		}
	}
}
