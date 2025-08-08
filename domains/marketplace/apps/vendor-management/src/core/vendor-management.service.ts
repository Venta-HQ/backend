import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import {
	Location,
	Vendor,
	VendorCreateData,
	VendorLocationUpdate,
	VendorUpdateData,
} from '@app/proto/marketplace/vendor-management';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

interface GeospatialBounds {
	neBounds: Location;
	swBounds: Location;
}

@Injectable()
export class VendorManagementService {
	private readonly logger = new Logger(VendorManagementService.name);

	constructor(
		private readonly prisma: PrismaService,
		@Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
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
				include: {
					location: true,
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
				primaryImage: vendor.imageUrl || '',
				location: vendor.location
					? {
							lat: vendor.location.coordinates.latitude,
							long: vendor.location.coordinates.longitude,
						}
					: undefined,
				createdAt: vendor.createdAt.toISOString(),
				updatedAt: vendor.updatedAt.toISOString(),
			};
		} catch (error) {
			this.logger.error('Failed to get vendor', error.stack, { error, vendorId });
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to get vendor', {
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
				throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.USER_NOT_FOUND, 'User not found', {
					userId: data.userId,
				});
			}

			if (user.vendors.length > 0) {
				throw new AppError(
					ErrorType.VALIDATION,
					ErrorCodes.VENDOR_LIMIT_EXCEEDED,
					'User already has a vendor account',
					{
						userId: data.userId,
					},
				);
			}

			// Create vendor
			const vendor = await this.prisma.db.vendor.create({
				data: {
					name: data.name,
					description: data.description,
					email: data.email,
					phone: data.phone,
					website: data.website,
					imageUrl: data.imageUrl,
					ownerId: data.userId,
				},
			});

			this.logger.log('Vendor created successfully', {
				userId: data.userId,
				vendorId: vendor.id,
			});

			// Emit vendor created event
			await this.natsClient.emit('marketplace.vendor.created', {
				vendorId: vendor.id,
				userId: data.userId,
			});

			return vendor.id;
		} catch (error) {
			if (error instanceof AppError) throw error;

			this.logger.error('Failed to create vendor', error.stack, {
				error,
				userId: data.userId,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to create vendor', {
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
				throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.VENDOR_NOT_FOUND, 'Vendor not found', {
					vendorId: data.id,
				});
			}

			if (vendor.ownerId !== data.userId) {
				throw new AppError(
					ErrorType.UNAUTHORIZED,
					ErrorCodes.VENDOR_UNAUTHORIZED,
					'User not authorized to update vendor',
					{
						userId: data.userId,
						vendorId: data.id,
					},
				);
			}

			// Update vendor
			await this.prisma.db.vendor.update({
				where: { id: data.id },
				data: {
					name: data.name,
					description: data.description,
					email: data.email,
					phone: data.phone,
					website: data.website,
					imageUrl: data.imageUrl,
				},
			});

			this.logger.log('Vendor updated successfully', {
				userId: data.userId,
				vendorId: data.id,
			});

			// Emit vendor updated event
			await this.natsClient.emit('marketplace.vendor.updated', {
				vendorId: data.id,
				userId: data.userId,
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			this.logger.error('Failed to update vendor', error.stack, {
				error,
				vendorId: data.id,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to update vendor', {
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
				throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.VENDOR_NOT_FOUND, 'Vendor not found', {
					vendorId: data.vendorId,
				});
			}

			// Update vendor location
			await this.prisma.db.vendor.update({
				where: { id: data.vendorId },
				data: {
					location: {
						upsert: {
							create: {
								coordinates: {
									latitude: data.location!.lat,
									longitude: data.location!.long,
								},
							},
							update: {
								coordinates: {
									latitude: data.location!.lat,
									longitude: data.location!.long,
								},
							},
						},
					},
				},
			});

			this.logger.log('Vendor location updated successfully', {
				location: `${data.location?.lat}, ${data.location?.long}`,
				vendorId: data.vendorId,
			});

			// Emit location updated event
			await this.natsClient.emit('location.vendor.location_updated', {
				vendorId: data.vendorId,
				location: data.location,
			});
		} catch (error) {
			if (error instanceof AppError) throw error;

			this.logger.error('Failed to update vendor location', error.stack, {
				error,
				location: data.location,
				vendorId: data.vendorId,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.LOCATION_UPDATE_FAILED, 'Failed to update vendor location', {
				operation: 'update_vendor_location',
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
					location: {
						coordinates: {
							latitude: {
								gte: bounds.swBounds.lat,
								lte: bounds.neBounds.lat,
							},
							longitude: {
								gte: bounds.swBounds.long,
								lte: bounds.neBounds.long,
							},
						},
					},
				},
				include: {
					location: true,
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
				primaryImage: vendor.imageUrl || '',
				location: vendor.location
					? {
							lat: vendor.location.coordinates.latitude,
							long: vendor.location.coordinates.longitude,
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
			throw new AppError(
				ErrorType.INTERNAL,
				ErrorCodes.LOCATION_QUERY_FAILED,
				'Failed to get vendors in geographic area',
				{
					bounds,
					operation: 'get_vendors_in_area',
				},
			);
		}
	}
}
