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

interface VendorOnboardingData {
	description?: string;
	email?: string;
	name: string;
	ownerId: string;
	phone?: string;
	primaryImage?: string;
	website?: string;
}

@Injectable()
export class VendorService {
	private readonly logger = new Logger(VendorService.name);

	constructor(
		private prisma: PrismaService,
		private eventService: EventService,
	) {}

	/**
	 * Onboard a new vendor to the marketplace
	 * Domain method for vendor onboarding with business logic
	 */
	async onboardVendor(onboardingData: VendorOnboardingData): Promise<string> {
		this.logger.log('Starting vendor onboarding process', {
			ownerId: onboardingData.ownerId,
			vendorName: onboardingData.name,
		});

		try {
			const vendor = await this.prisma.db.vendor.create({
				data: {
					description: onboardingData.description || '',
					email: onboardingData.email || '',
					name: onboardingData.name,
					ownerId: onboardingData.ownerId,
					phone: onboardingData.phone || '',
					primaryImage: onboardingData.primaryImage || '',
					website: onboardingData.website || '',
				},
			});

			this.logger.log('Vendor onboarding completed successfully', {
				ownerId: onboardingData.ownerId,
				vendorId: vendor.id,
				vendorName: onboardingData.name,
			});

			// Domain event - vendor created (this event is actually used by search-discovery)
			await this.eventService.emit('vendor.created', vendor);

			return vendor.id;
		} catch (error) {
			this.logger.error('Failed to onboard vendor', {
				error,
				ownerId: onboardingData.ownerId,
				vendorName: onboardingData.name,
			});
			throw new VendorDomainError(VendorDomainErrorCodes.DATABASE_ERROR, 'Failed to onboard vendor', {
				operation: 'onboard_vendor',
				ownerId: onboardingData.ownerId,
			});
		}
	}

	/**
	 * Get vendor by ID
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
	 * Create vendor (legacy method - use onboardVendor for new vendors)
	 */
	async createVendor(data: VendorCreateData): Promise<string> {
		this.logger.log('Creating new vendor', { ownerId: data.userId });

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
	 * Update vendor profile
	 */
	async updateVendor(id: string, userId: string, data: Omit<VendorUpdateData, 'id' | 'userId'>): Promise<void> {
		this.logger.log('Updating vendor profile', { ownerId: userId, vendorId: id });

		try {
			const { imageUrl, ...updateData } = data;

			const vendor = await this.prisma.db.vendor.update({
				data: {
					...updateData,
					...(imageUrl ? { primaryImage: imageUrl } : {}),
				},
				where: { id, ownerId: userId },
			});

			this.logger.log('Vendor profile updated successfully', { ownerId: userId, vendorId: id });

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
	 * Delete vendor and all associated data
	 * Domain method for vendor deletion with cleanup
	 */
	async deleteVendor(id: string, userId: string): Promise<void> {
		this.logger.log('Starting vendor deletion process', { ownerId: userId, vendorId: id });

		try {
			const vendor = await this.prisma.db.vendor.findFirst({
				where: { id, ownerId: userId },
			});

			await this.prisma.db.vendor.delete({
				where: { id },
			});

			this.logger.log('Vendor and associated data deleted successfully', { ownerId: userId, vendorId: id });

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
}
