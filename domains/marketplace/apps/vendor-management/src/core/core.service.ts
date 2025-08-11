import { Injectable, Logger } from '@nestjs/common';
import { VendorCreate, VendorUpdate } from '@venta/domains/marketplace/contracts/types/domain';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { EventService, PrismaService } from '@venta/nest/modules';
import { Vendor } from '@venta/proto/marketplace/vendor-management';

@Injectable()
export class CoreService {
	private readonly logger = new Logger(CoreService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
	) {}

	/**
	 * Get vendor by ID
	 * Domain method for vendor lookup
	 */
	async getVendorById(vendorId: string): Promise<Vendor | null> {
		this.logger.log('Getting vendor by ID', { vendorId });

		try {
			const vendor = await this.prisma.db.vendor.findUnique({
				where: { id: vendorId },
				select: {
					id: true,
					name: true,
					description: true,
					email: true,
					phone: true,
					website: true,
					isActive: true,
					profileImage: true,
					lat: true,
					lng: true,
					createdAt: true,
					updatedAt: true,
				},
			});

			if (!vendor) {
				return null;
			}

			return {
				id: vendor.id,
				name: vendor.name,
				description: vendor.description || '',
				email: vendor.email,
				phone: vendor.phone || '',
				website: vendor.website || '',
				isOpen: vendor.isActive,
				primaryImage: vendor.profileImage || '',
				coordinates:
					vendor.lat && vendor.lng
						? {
								lat: vendor.lat,
								lng: vendor.lng,
							}
						: undefined,
				createdAt: vendor.createdAt.toISOString(),
				updatedAt: vendor.updatedAt.toISOString(),
			};
		} catch (error) {
			this.logger.error('Failed to get vendor', error.stack, { error, vendorId });
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_vendor_by_id',
				vendorId,
			});
		}
	}

	/**
	 * Create new vendor
	 * Domain method for vendor creation with business logic
	 */
	async createVendor(data: VendorCreate, userId: string): Promise<string> {
		this.logger.log('Creating new vendor');

		try {
			// Create vendor
			const vendor = await this.prisma.db.vendor.create({
				data: {
					name: data.name,
					description: data.description,
					email: data.email,
					phone: data.phone,
					website: data.website,
					profileImage: data.imageUrl,
					ownerId: userId,
				},
			});

			if (!vendor) {
				throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
					operation: 'create_vendor',
					userId: userId,
				});
			}

			this.logger.log('Vendor created successfully', {
				userId: userId,
				vendorId: vendor.id,
			});

			// Emit vendor created event
			await this.eventService.emit('marketplace.vendor.onboarded', {
				vendorId: vendor.id,
				ownerId: vendor.ownerId,
				timestamp: vendor.createdAt.toISOString(),
			});

			return vendor.id;
		} catch (error) {
			if (error instanceof AppError) throw error;

			this.logger.error('Failed to create vendor', error.stack, {
				error,
				userId: userId,
			});
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_vendor',
				userId: userId,
			});
		}
	}

	/**
	 * Update vendor details
	 * Domain method for vendor profile updates
	 */
	async updateVendor(data: VendorUpdate, userId: string): Promise<void> {
		this.logger.log('Updating vendor', { vendorId: data.id });

		try {
			// Update vendor
			const updatedVendor = await this.prisma.db.vendor.update({
				where: { id: data.id, ownerId: userId },
				data: {
					name: data.name,
					description: data.description,
					email: data.email,
					phone: data.phone,
					website: data.website,
					profileImage: data.imageUrl,
				},
			});

			if (!updatedVendor) {
				throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
					operation: 'update_vendor',
					vendorId: data.id,
				});
			}

			this.logger.log('Vendor updated successfully', {
				userId: userId,
				vendorId: data.id,
			});

			// Emit vendor updated event
			await this.eventService.emit('marketplace.vendor.profile_updated', {
				vendorId: updatedVendor.id,
				updatedFields: ['name', 'description', 'email', 'phone', 'website', 'profileImage'],
				timestamp: updatedVendor.updatedAt.toISOString(),
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			this.logger.error('Failed to update vendor', error.stack, {
				error,
				vendorId: data.id,
			});
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'update_vendor',
				vendorId: data.id,
			});
		}
	}
}
