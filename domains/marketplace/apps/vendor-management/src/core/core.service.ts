import { Injectable, Logger } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { EventService, PrismaService } from '@venta/nest/modules';
import {
	Vendor,
	VendorCreateData,
	VendorLocationRequest,
	VendorUpdateData,
} from '@venta/proto/marketplace/vendor-management';

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
	async createVendor(data: VendorCreateData): Promise<string> {
		this.logger.log('Creating new vendor', { userId: data.userId });

		try {
			// Verify user exists and can create vendor
			const user = await this.prisma.db.user.findUnique({
				where: { id: data.userId },
				include: {
					vendors: true,
				},
			});

			if (!user) {
				throw AppError.notFound(ErrorCodes.ERR_ENTITY_NOT_FOUND, {
					entityType: 'user',
					entityId: data.userId,
					userId: data.userId,
				});
			}

			if (user.vendors.length > 0) {
				throw AppError.validation(ErrorCodes.ERR_ENTITY_LIMIT_EXCEEDED, {
					entityType: 'vendor',
					userId: data.userId,
				});
			}

			// Create vendor
			const vendor = await this.prisma.db.vendor.create({
				data: {
					name: data.name,
					description: data.description,
					email: data.email,
					phone: data.phone,
					website: data.website,
					primaryImage: data.imageUrl,
					ownerId: data.userId,
				},
			});

			this.logger.log('Vendor created successfully', {
				userId: data.userId,
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
				userId: data.userId,
			});
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_vendor',
				userId: data.userId,
			});
		}
	}

	/**
	 * Update vendor details
	 * Domain method for vendor profile updates
	 */
	async updateVendor(data: VendorUpdateData): Promise<void> {
		this.logger.log('Updating vendor', { vendorId: data.id });

		try {
			// Verify vendor exists and user has permission
			const vendor = await this.prisma.db.vendor.findUnique({
				where: { id: data.id },
			});

			if (!vendor) {
				throw AppError.notFound(ErrorCodes.ERR_ENTITY_NOT_FOUND, {
					entityType: 'vendor',
					entityId: data.id,
					vendorId: data.id,
				});
			}

			if (vendor.ownerId !== data.userId) {
				throw AppError.unauthorized(ErrorCodes.ERR_ENTITY_UNAUTHORIZED, {
					entityType: 'vendor',
					entityId: data.id,
					userId: data.userId,
					vendorId: data.id,
				});
			}

			// Update vendor
			const updatedVendor = await this.prisma.db.vendor.update({
				where: { id: data.id },
				data: {
					name: data.name,
					description: data.description,
					email: data.email,
					phone: data.phone,
					website: data.website,
					primaryImage: data.imageUrl,
				},
			});

			this.logger.log('Vendor updated successfully', {
				userId: data.userId,
				vendorId: data.id,
			});

			// Emit vendor updated event
			await this.eventService.emit('marketplace.vendor.profile_updated', {
				vendorId: updatedVendor.id,
				updatedFields: ['name', 'description', 'email', 'phone', 'website', 'primaryImage'],
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

	/**
	 * Get vendors within a geographic bounding box
	 * Domain method for vendor discovery
	 */
	async getVendorsInArea(bounds: VendorLocationRequest): Promise<Vendor[]> {
		this.logger.log('Getting vendors in geographic area', {
			neBounds: `${bounds.ne.lat}, ${bounds.ne.long}`,
			swBounds: `${bounds.sw.lat}, ${bounds.sw.long}`,
		});

		try {
			// Get vendors within bounds using Prisma's spatial queries
			const vendors = await this.prisma.db.vendor.findMany({
				where: {
					lat: {
						gte: bounds.sw.lat,
						lte: bounds.ne.lat,
					},
					long: {
						gte: bounds.sw.long,
						lte: bounds.ne.long,
					},
				},
			});

			return vendors.map((vendor) => ({
				id: vendor.id,
				name: vendor.name,
				description: vendor.description || '',
				email: vendor.email,
				phone: vendor.phone || '',
				website: vendor.website || '',
				isOpen: vendor.isOpen,
				primaryImage: vendor.primaryImage || '',
				coordinates:
					vendor.lat && vendor.long
						? {
								lat: vendor.lat,
								long: vendor.long,
							}
						: undefined,
				createdAt: vendor.createdAt.toISOString(),
				updatedAt: vendor.updatedAt.toISOString(),
			}));
		} catch (error) {
			this.logger.error('Failed to get vendors in area', error.stack, {
				bounds,
				error,
			});
			throw AppError.internal(ErrorCodes.ERR_QUERY_FAILED, {
				operation: 'get_vendors_in_area',
				message: 'Failed to query vendors in area',
			});
		}
	}
}
