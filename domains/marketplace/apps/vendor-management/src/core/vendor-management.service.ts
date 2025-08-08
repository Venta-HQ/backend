import { AppError, ErrorCodes } from '@app/nest/errors';
import { EventService, PrismaService } from '@app/nest/modules';
import {
	Location,
	Vendor,
	VendorCreateData,
	VendorLocationUpdate,
	VendorUpdateData,
} from '@app/proto/marketplace/vendor-management';
import { VendorACL } from '@domains/marketplace/contracts/anti-corruption-layers/vendor-acl';
import { Marketplace } from '@domains/marketplace/contracts/types/context-mapping.types';
import { Injectable, Logger } from '@nestjs/common';

interface GeospatialBounds {
	neBounds: Location;
	swBounds: Location;
}

@Injectable()
export class VendorManagementService {
	private readonly logger = new Logger(VendorManagementService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly vendorACL: VendorACL,
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
					isOpen: true,
					primaryImage: true,
					lat: true,
					long: true,
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
				open: vendor.isOpen,
				primaryImage: vendor.primaryImage || '',
				location:
					vendor.lat && vendor.long
						? {
								lat: vendor.lat,
								long: vendor.long,
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
				throw AppError.notFound(ErrorCodes.ERR_USER_NOT_FOUND, {
					userId: data.userId,
				});
			}

			if (user.vendors.length > 0) {
				throw AppError.validation(ErrorCodes.ERR_VENDOR_LIMIT, {
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
			await this.eventService.emit('marketplace.vendor.created', {
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
				throw AppError.notFound(ErrorCodes.ERR_VENDOR_NOT_FOUND, {
					vendorId: data.id,
				});
			}

			if (vendor.ownerId !== data.userId) {
				throw AppError.unauthorized(ErrorCodes.ERR_VENDOR_UNAUTHORIZED, {
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
			await this.eventService.emit('marketplace.vendor.updated', {
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
	 * Update vendor location
	 * Domain method for vendor location management
	 */
	async updateVendorLocation(data: VendorLocationUpdate): Promise<void> {
		this.logger.log('Updating vendor location', {
			location: `${data.location?.lat}, ${data.location?.long}`,
			vendorId: data.vendorId,
		});

		try {
			// Verify vendor exists
			const vendor = await this.prisma.db.vendor.findUnique({
				where: { id: data.vendorId },
			});

			if (!vendor) {
				throw AppError.notFound(ErrorCodes.ERR_VENDOR_NOT_FOUND, {
					vendorId: data.vendorId,
				});
			}

			// Update vendor location
			const updatedVendor = await this.prisma.db.vendor.update({
				where: { id: data.vendorId },
				data: {
					lat: data.location!.lat,
					long: data.location!.long,
				},
			});

			this.logger.log('Vendor location updated successfully', {
				location: `${data.location?.lat}, ${data.location?.long}`,
				vendorId: data.vendorId,
			});

			// Emit location updated event
			await this.eventService.emit('location.vendor.location_updated', {
				vendorId: updatedVendor.id,
				location: {
					lat: updatedVendor.lat || 0,
					long: updatedVendor.long || 0,
				},
				timestamp: updatedVendor.updatedAt.toISOString(),
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			this.logger.error('Failed to update vendor location', error.stack, {
				error,
				location: data.location,
				vendorId: data.vendorId,
			});
			throw AppError.internal(ErrorCodes.ERR_LOC_UPDATE_FAILED, {
				vendorId: data.vendorId,
			});
		}
	}

	/**
	 * Get vendors within a geographic bounding box
	 * Domain method for vendor discovery
	 */
	async getVendorsInArea(bounds: GeospatialBounds): Promise<Vendor[]> {
		this.logger.log('Getting vendors in geographic area', {
			neBounds: `${bounds.neBounds.lat}, ${bounds.neBounds.long}`,
			swBounds: `${bounds.swBounds.lat}, ${bounds.swBounds.long}`,
		});

		try {
			// Get vendors within bounds using Prisma's spatial queries
			const vendors = await this.prisma.db.vendor.findMany({
				where: {
					lat: {
						gte: bounds.swBounds.lat,
						lte: bounds.neBounds.lat,
					},
					long: {
						gte: bounds.swBounds.long,
						lte: bounds.neBounds.long,
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
				open: vendor.isOpen,
				primaryImage: vendor.primaryImage || '',
				location:
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
			throw AppError.internal(ErrorCodes.ERR_LOC_QUERY_FAILED, {
				message: 'Failed to query vendors in area',
			});
		}
	}
}
