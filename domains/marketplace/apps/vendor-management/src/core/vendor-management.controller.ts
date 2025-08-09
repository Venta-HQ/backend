import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorACL } from '@venta/domains/marketplace/contracts/anti-corruption-layers/vendor-acl';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcAuthGuard } from '@venta/nest/guards';
import {
	Empty,
	MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME,
	Vendor,
	VendorCreateData,
	VendorCreateResponse,
	VendorLocationRequest,
	VendorLocationResponse,
	VendorLocationUpdate,
	VendorLookupByIdData,
	VendorManagementServiceController,
	VendorUpdateData,
	VendorUpdateResponse,
} from '@venta/proto/marketplace/vendor-management';
import { VendorManagementService } from './vendor-management.service';

/**
 * gRPC controller for vendor management service
 * Implements the service interface generated from proto/marketplace/vendor-management.proto
 */
@Controller()
@UseGuards(GrpcAuthGuard)
export class VendorManagementController implements VendorManagementServiceController {
	private readonly logger = new Logger(VendorManagementController.name);

	constructor(
		private readonly vendorManagementService: VendorManagementService,
		private readonly vendorACL: VendorACL,
	) {}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'getVendorById')
	async getVendorById(request: VendorLookupByIdData): Promise<Vendor> {
		this.logger.debug('Getting vendor by ID', { vendorId: request.id });

		try {
			// Validate input
			if (!this.vendorACL.validateVendorLookupById(request)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_UUID, {
					uuid: (request as any)?.id || 'undefined',
				});
			}

			const vendor = await this.vendorManagementService.getVendorById(request.id);
			if (!vendor) {
				throw AppError.notFound(ErrorCodes.ERR_VENDOR_NOT_FOUND, {
					vendorId: request.id,
				});
			}

			return vendor;
		} catch (error) {
			this.logger.error('Failed to get vendor', {
				error: error.message,
				vendorId: request.id,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_vendor_by_id',
				vendorId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'createVendor')
	async createVendor(request: VendorCreateData): Promise<VendorCreateResponse> {
		this.logger.debug('Creating new vendor', { userId: request.userId });

		try {
			// Validate input
			if (!this.vendorACL.validateVendorCreateData(request)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					message: 'Invalid vendor data',
					userId: (request as any)?.userId || 'undefined',
				});
			}

			// Convert to domain model
			const createData = this.vendorACL.toDomainVendorCreateData(request);
			const vendorId = await this.vendorManagementService.createVendor(createData);

			return { id: vendorId };
		} catch (error) {
			this.logger.error('Failed to create vendor', {
				error: error.message,
				userId: request.userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_vendor',
				userId: request.userId,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'updateVendor')
	async updateVendor(request: VendorUpdateData): Promise<VendorUpdateResponse> {
		this.logger.debug('Updating vendor', { vendorId: request.id });

		try {
			// Validate input
			if (!this.vendorACL.validateVendorUpdateData(request)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					message: 'Invalid vendor update data',
					vendorId: (request as any)?.id || 'undefined',
				});
			}

			// Convert to domain model
			const updateData = this.vendorACL.toDomainVendorUpdateData(request);
			await this.vendorManagementService.updateVendor(updateData);

			return { message: 'Vendor updated successfully', success: true };
		} catch (error) {
			this.logger.error('Failed to update vendor', {
				error: error.message,
				vendorId: request.id,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'update_vendor',
				vendorId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'updateVendorLocation')
	async updateVendorLocation(request: VendorLocationUpdate): Promise<Empty> {
		this.logger.debug('Updating vendor location', {
			location: `${request.location?.lat}, ${request.location?.long}`,
			vendorId: request.vendorId,
		});

		try {
			// Validate input
			if (!this.vendorACL.validateVendorLocationUpdate(request)) {
				throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
					lat: (request as any)?.location?.lat || 'undefined',
					long: (request as any)?.location?.long || 'undefined',
				});
			}

			// Convert to domain model
			const locationUpdate = this.vendorACL.toDomainVendorLocationUpdate(request);
			await this.vendorManagementService.updateVendorLocation(locationUpdate);

			return {};
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error.message,
				location: request.location,
				vendorId: request.vendorId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_LOC_UPDATE_FAILED, {
				vendorId: request.vendorId,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'getVendorsInArea')
	async getVendorsInArea(request: VendorLocationRequest): Promise<VendorLocationResponse> {
		this.logger.debug('Getting vendors in area', {
			neBounds: `${request.neLocation?.lat}, ${request.neLocation?.long}`,
			swBounds: `${request.swLocation?.lat}, ${request.swLocation?.long}`,
		});

		try {
			// Convert to domain model
			const bounds = this.vendorACL.toDomainGeospatialBounds(request);
			const vendors = await this.vendorManagementService.getVendorsInArea(bounds);

			return { vendors };
		} catch (error) {
			this.logger.error('Failed to get vendors in area', {
				error: error.message,
				neBounds: request.neLocation,
				swBounds: request.swLocation,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_LOC_QUERY_FAILED, {
				message: 'Failed to query vendors in area',
			});
		}
	}
}
