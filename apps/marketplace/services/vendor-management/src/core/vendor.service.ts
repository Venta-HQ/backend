import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { EventService, PrismaService } from '@app/nest/modules';
import { Injectable, Logger } from '@nestjs/common';
import { MarketplaceToLocationContextMapper } from '../../../../contracts/context-mappers/marketplace-to-location-context-mapper';

export interface VendorOnboardingData {
	description?: string;
	email?: string;
	location?: { lat: number; lng: number };
	name: string;
	ownerId: string;
	phone?: string;
	primaryImage?: string;
	source?: 'web_registration' | 'mobile_app' | 'admin';
	website?: string;
}

export interface UpdateVendorData {
	description?: string;
	email?: string;
	name?: string;
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
		private locationContextMapper: MarketplaceToLocationContextMapper,
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

			// Emit DDD domain event with rich business context
			await this.eventService.emit('marketplace.vendor.onboarded', {
				location: onboardingData.location || { lat: 0, lng: 0 },
				ownerId: onboardingData.ownerId,
				vendorId: vendor.id,
				// timestamp automatically added by schema default
			});

			return vendor.id;
		} catch (error) {
			this.logger.error('Failed to onboard vendor', {
				error,
				ownerId: onboardingData.ownerId,
				vendorName: onboardingData.name,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to onboard vendor', {
				operation: 'onboard_vendor',
				ownerId: onboardingData.ownerId,
			});
		}
	}

	/**
	 * Update vendor profile
	 * Domain method for vendor profile updates with business logic
	 */
	async updateVendor(vendorId: string, updateData: UpdateVendorData): Promise<any> {
		this.logger.log('Updating vendor profile', { updateData, vendorId });

		try {
			const vendor = await this.prisma.db.vendor.update({
				data: updateData,
				where: { id: vendorId },
			});

			// Emit DDD domain event with business context
			await this.eventService.emit('marketplace.vendor.profile_updated', {
				updatedFields: Object.keys(updateData),
				vendorId: vendor.id,
				// timestamp automatically added by schema default
			});

			return vendor;
		} catch (error) {
			this.logger.error('Failed to update vendor', error.stack, { error, vendorId });
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to update vendor', {
				operation: 'update_vendor',
				vendorId,
			});
		}
	}

	/**
	 * Delete vendor
	 * Domain method for vendor deactivation with business logic
	 */
	async deleteVendor(vendorId: string): Promise<void> {
		this.logger.log('Deactivating vendor', { vendorId });

		try {
			const vendor = await this.prisma.db.vendor.delete({
				where: { id: vendorId },
			});

			// Emit DDD domain event with business context
			await this.eventService.emit('marketplace.vendor.deactivated', {
				ownerId: vendor.ownerId,
				vendorId: vendor.id,
				// timestamp automatically added by schema default
			});
		} catch (error) {
			this.logger.error('Failed to deactivate vendor', error.stack, { error, vendorId });
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to deactivate vendor', {
				operation: 'delete_vendor',
				vendorId,
			});
		}
	}

	/**
	 * Get vendor by ID
	 * Domain method for vendor retrieval
	 */
	async getVendorById(vendorId: string): Promise<any | null> {
		this.logger.log('Retrieving vendor by ID', { vendorId });

		try {
			const vendor = await this.prisma.db.vendor.findUnique({
				where: { id: vendorId },
			});

			if (!vendor) {
				this.logger.log('Vendor not found', { vendorId });
				return null;
			}

			return vendor;
		} catch (error) {
			this.logger.error('Failed to retrieve vendor', error.stack, { error, vendorId });
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to retrieve vendor', {
				operation: 'get_vendor_by_id',
				vendorId,
			});
		}
	}

	/**
	 * Get all vendors
	 * Domain method for vendor listing
	 */
	async getAllVendors(): Promise<any[]> {
		this.logger.log('Retrieving all vendors');

		try {
			const vendors = await this.prisma.db.vendor.findMany();
			return vendors;
		} catch (error) {
			this.logger.error('Failed to retrieve vendors', error.stack, { error });
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to retrieve vendors', {
				operation: 'get_all_vendors',
			});
		}
	}

	/**
	 * Update vendor location
	 * Domain method for vendor location updates
	 */
	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void> {
		this.logger.log('Updating vendor location', { location, vendorId });

		try {
			// Transform location data using context mapper
			const locationServicesData = this.locationContextMapper.toLocationServicesVendorUpdate(vendorId, location);

			await this.prisma.db.vendor.update({
				data: {
					lat: locationServicesData.coordinates.latitude,
					long: locationServicesData.coordinates.longitude,
				},
				where: { id: vendorId },
			});

			// Emit DDD domain event with business context
			await this.eventService.emit('marketplace.vendor.profile_updated', {
				vendorId,
				updatedFields: ['location'],
				timestamp: locationServicesData.lastUpdateTime,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', error.stack, { error, vendorId });
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to update vendor location', {
				operation: 'update_vendor_location',
				vendorId,
			});
		}
	}
}
