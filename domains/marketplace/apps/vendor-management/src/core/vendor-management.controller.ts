import { Controller, Logger, UseGuards, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
	VendorCreateACLPipe,
	VendorGeospatialBoundsACLPipe,
	VendorLocationUpdateACLPipe,
	VendorLookupACLPipe,
	VendorUpdateACLPipe,
} from '@venta/domains/marketplace/contracts';
import { Marketplace } from '@venta/domains/marketplace/contracts/types/context-mapping.types';
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

	constructor(private readonly vendorManagementService: VendorManagementService) {}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'getVendorById')
	@UsePipes(VendorLookupACLPipe)
	async getVendorById(request: { id: string }): Promise<Vendor> {
		this.logger.debug('Getting vendor by ID', { vendorId: request.id });

		try {
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
	@UsePipes(VendorCreateACLPipe)
	async createVendor(request: Marketplace.Core.VendorCreateData): Promise<VendorCreateResponse> {
		this.logger.debug('Creating new vendor', { userId: request.userId });

		try {
			const vendorId = await this.vendorManagementService.createVendor(request);
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
	@UsePipes(VendorUpdateACLPipe)
	async updateVendor(request: Marketplace.Core.VendorUpdateData): Promise<VendorUpdateResponse> {
		this.logger.debug('Updating vendor', { vendorId: request.id });

		try {
			await this.vendorManagementService.updateVendor(request);
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
	@UsePipes(VendorLocationUpdateACLPipe)
	async updateVendorLocation(request: Marketplace.Core.VendorLocationUpdate): Promise<Empty> {
		this.logger.debug('Updating vendor location', {
			location: `${request.location.lat}, ${request.location.long}`,
			vendorId: request.vendorId,
		});

		try {
			await this.vendorManagementService.updateVendorLocation(request);
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
	@UsePipes(VendorGeospatialBoundsACLPipe)
	async getVendorsInArea(request: Marketplace.Core.GeospatialBounds): Promise<VendorLocationResponse> {
		this.logger.debug('Getting vendors in area', {
			neBounds: `${request.ne.lat}, ${request.ne.long}`,
			swBounds: `${request.sw.lat}, ${request.sw.long}`,
		});

		try {
			const vendors = await this.vendorManagementService.getVendorsInArea(request);
			return { vendors };
		} catch (error) {
			this.logger.error('Failed to get vendors in area', {
				error: error.message,
				neBounds: request.ne,
				swBounds: request.sw,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_LOC_QUERY_FAILED, {
				message: 'Failed to query vendors in area',
			});
		}
	}
}
