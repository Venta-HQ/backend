import { VendorDomainError, VendorDomainErrorCodes } from '@app/nest/errors';
import { EventService, PrismaService } from '@app/nest/modules';
import { VendorCreateData, VendorUpdateData } from '@app/proto/marketplace/vendor-management';
import { Injectable, Logger } from '@nestjs/common';

interface VendorLocationData {
	lat: number;
	long: number;
}

interface VendorProfile {
	createdAt: Date;
	description?: string;
	id: string;
	lat?: number;
	long?: number;
	name: string;
	ownerId: string;
	primaryImage?: string;
	updatedAt: Date;
}

@Injectable()
export class VendorService {
	private readonly logger = new Logger(VendorService.name);

	constructor(
		private prisma: PrismaService,
		private eventService: EventService,
	) {}

	/**
	 * Get vendor by ID with domain validation
	 */
	async getVendorById(id: string): Promise<VendorProfile | null> {
		this.logger.log('Getting vendor profile', { vendorId: id });

		try {
			const vendor = await this.prisma.db.vendor.findFirst({
				where: { id },
			});

			if (!vendor) {
				this.logger.log('Vendor not found', { vendorId: id });
				return null;
			}

			this.logger.log('Vendor profile retrieved successfully', { vendorId: id });
			return vendor;
		} catch (error) {
			this.logger.error('Failed to get vendor profile', { error, vendorId: id });
			throw new VendorDomainError(VendorDomainErrorCodes.DATABASE_ERROR, 'Failed to retrieve vendor profile', {
				operation: 'get_vendor_by_id',
				vendorId: id,
			});
		}
	}

	/**
	 * Create vendor with domain validation
	 */
	async createVendor(data: VendorCreateData): Promise<string> {
		this.logger.log('Creating new vendor', { ownerId: data.userId });

		// Domain validation
		await this.validateUserExists(data.userId);
		await this.validateVendorData(data);

		try {
			const { imageUrl, userId, ...rest } = data;
			const vendor = await this.prisma.db.vendor.create({
				data: {
					...rest,
					ownerId: userId,
					primaryImage: imageUrl,
				},
			});

			this.logger.log('Vendor created successfully', { ownerId: userId, vendorId: vendor.id });

			// Domain event - vendor created (this event is actually used by search-discovery)
			await this.eventService.emit('vendor.created', vendor);

			return vendor.id;
		} catch (error) {
			this.logger.error('Failed to create vendor', { error, ownerId: data.userId });
			throw new VendorDomainError(VendorDomainErrorCodes.DATABASE_ERROR, 'Failed to create vendor', {
				operation: 'create_vendor',
				ownerId: data.userId,
			});
		}
	}

	/**
	 * Update vendor with domain validation
	 */
	async updateVendor(id: string, userId: string, data: Omit<VendorUpdateData, 'id' | 'userId'>): Promise<void> {
		this.logger.log('Updating vendor', { ownerId: userId, vendorId: id });

		// Domain validation
		await this.validateVendorExists(id);
		await this.validateVendorOwnership(id, userId);
		await this.validateVendorData(data);

		try {
			const { imageUrl, ...updateData } = data;

			const vendor = await this.prisma.db.vendor.update({
				data: {
					...updateData,
					...(imageUrl ? { primaryImage: imageUrl } : {}),
				},
				where: { id, ownerId: userId },
			});

			this.logger.log('Vendor updated successfully', { ownerId: userId, vendorId: id });

			// Domain event - vendor updated (this event is actually used by search-discovery)
			await this.eventService.emit('vendor.updated', vendor);
		} catch (error) {
			this.logger.error('Failed to update vendor', { error, ownerId: userId, vendorId: id });
			throw new VendorDomainError(VendorDomainErrorCodes.DATABASE_ERROR, 'Failed to update vendor', {
				operation: 'update_vendor',
				ownerId: userId,
				vendorId: id,
			});
		}
	}

	/**
	 * Delete vendor with domain validation
	 */
	async deleteVendor(id: string, userId: string): Promise<void> {
		this.logger.log('Deleting vendor', { ownerId: userId, vendorId: id });

		// Domain validation
		await this.validateVendorExists(id);
		await this.validateVendorOwnership(id, userId);

		try {
			const vendor = await this.prisma.db.vendor.findFirst({
				where: { id, ownerId: userId },
			});

			await this.prisma.db.vendor.delete({
				where: { id },
			});

			this.logger.log('Vendor deleted successfully', { ownerId: userId, vendorId: id });

			// Domain event - vendor deleted (this event is actually used by search-discovery)
			await this.eventService.emit('vendor.deleted', vendor);
		} catch (error) {
			this.logger.error('Failed to delete vendor', { error, ownerId: userId, vendorId: id });
			throw new VendorDomainError(VendorDomainErrorCodes.DATABASE_ERROR, 'Failed to delete vendor', {
				operation: 'delete_vendor',
				ownerId: userId,
				vendorId: id,
			});
		}
	}

	/**
	 * Update vendor location from location service events
	 * This method is called when the location service publishes a vendor.location.updated event
	 * It doesn't require user authorization since it's a system-level operation
	 */
	async updateVendorLocation(vendorId: string, location: VendorLocationData): Promise<void> {
		this.logger.log('Updating vendor location from location service', { location, vendorId });

		// Domain validation
		await this.validateVendorExists(vendorId);
		await this.validateLocationData(location);

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

			this.logger.log('Vendor location updated successfully', {
				location: `${location.lat}, ${location.long}`,
				vendorId,
			});

			// Domain event - vendor updated (this event is actually used by search-discovery)
			await this.eventService.emit('vendor.updated', vendor);
		} catch (error) {
			this.logger.error('Failed to update vendor location in database', { error, vendorId });
			throw new VendorDomainError(VendorDomainErrorCodes.DATABASE_ERROR, 'Failed to update vendor location', {
				operation: 'update_vendor_location',
				vendorId,
			});
		}
	}

	/**
	 * Validate that vendor exists
	 */
	private async validateVendorExists(vendorId: string): Promise<void> {
		const vendor = await this.prisma.db.vendor.findFirst({
			where: { id: vendorId },
		});

		if (!vendor) {
			throw new VendorDomainError(VendorDomainErrorCodes.VENDOR_NOT_FOUND, 'Vendor not found', {
				vendorId,
			});
		}
	}

	/**
	 * Validate that user owns the vendor
	 */
	private async validateVendorOwnership(vendorId: string, userId: string): Promise<void> {
		const vendor = await this.prisma.db.vendor.findFirst({
			where: { id: vendorId, ownerId: userId },
		});

		if (!vendor) {
			throw new VendorDomainError(VendorDomainErrorCodes.INSUFFICIENT_PERMISSIONS, 'User does not own this vendor', {
				userId,
				vendorId,
			});
		}
	}

	/**
	 * Validate that user exists
	 */
	private async validateUserExists(userId: string): Promise<void> {
		const user = await this.prisma.db.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new VendorDomainError(VendorDomainErrorCodes.OWNER_NOT_FOUND, 'Vendor owner not found', {
				userId,
			});
		}
	}

	/**
	 * Validate vendor data according to domain rules
	 */
	private async validateVendorData(data: VendorCreateData | Omit<VendorUpdateData, 'id' | 'userId'>): Promise<void> {
		if (!data.name || data.name.trim().length === 0) {
			throw new VendorDomainError(VendorDomainErrorCodes.PROFILE_INCOMPLETE, 'Vendor name is required', {
				name: data.name,
			});
		}

		if (data.name.length > 100) {
			throw new VendorDomainError(VendorDomainErrorCodes.PROFILE_INCOMPLETE, 'Vendor name too long', {
				maxLength: 100,
				name: data.name,
			});
		}

		if (data.description && data.description.length > 1000) {
			throw new VendorDomainError(VendorDomainErrorCodes.PROFILE_INCOMPLETE, 'Vendor description too long', {
				description: data.description,
				maxLength: 1000,
			});
		}
	}

	/**
	 * Validate location data according to domain rules
	 */
	private async validateLocationData(location: VendorLocationData): Promise<void> {
		if (location.lat < -90 || location.lat > 90) {
			throw new VendorDomainError(VendorDomainErrorCodes.INVALID_LOCATION, 'Invalid latitude value', {
				lat: location.lat,
			});
		}

		if (location.long < -180 || location.long > 180) {
			throw new VendorDomainError(VendorDomainErrorCodes.INVALID_LOCATION, 'Invalid longitude value', {
				long: location.long,
			});
		}
	}
}
