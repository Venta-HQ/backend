import { AppError } from '@app/nest/errors';
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
} from '@app/proto/marketplace/vendor-management';
import { VendorACL } from '@domains/marketplace/contracts/anti-corruption-layers/vendor-acl';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorManagementService } from './vendor-management.service';

/**
 * gRPC controller for vendor management service
 * Implements the service interface generated from proto/marketplace/vendor-management.proto
 */
@Controller()
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
			// Validate request
			if (!this.vendorACL.validateVendorLookupData(request as unknown)) {
				throw AppError.validation('INVALID_VENDOR_ID', 'Invalid vendor ID', {
					vendorId: request.id,
				});
			}

			const vendor = await this.vendorManagementService.getVendorById(request.id);
			if (!vendor) {
				throw AppError.notFound('VENDOR_NOT_FOUND', 'Vendor not found', {
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

			throw AppError.internal('DATABASE_ERROR', 'Failed to get vendor', {
				vendorId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'createVendor')
	async createVendor(request: VendorCreateData): Promise<VendorCreateResponse> {
		this.logger.debug('Creating new vendor', { userId: request.userId });

		try {
			// Validate request
			if (!this.vendorACL.validateVendorCreateData(request as unknown)) {
				throw AppError.validation('INVALID_VENDOR_DATA', 'Invalid vendor data', {
					userId: request.userId,
				});
			}

			const vendorId = await this.vendorManagementService.createVendor(request);
			return { id: vendorId };
		} catch (error) {
			this.logger.error('Failed to create vendor', {
				error: error.message,
				userId: request.userId,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal('DATABASE_ERROR', 'Failed to create vendor', {
				userId: request.userId,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'updateVendor')
	async updateVendor(request: VendorUpdateData): Promise<VendorUpdateResponse> {
		this.logger.debug('Updating vendor', { vendorId: request.id });

		try {
			// Validate request
			if (!this.vendorACL.validateVendorUpdateData(request as unknown)) {
				throw AppError.validation('INVALID_VENDOR_DATA', 'Invalid vendor data', {
					vendorId: request.id,
				});
			}

			await this.vendorManagementService.updateVendor(request);
			return { message: 'Vendor updated successfully', success: true };
		} catch (error) {
			this.logger.error('Failed to update vendor', {
				error: error.message,
				vendorId: request.id,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal('DATABASE_ERROR', 'Failed to update vendor', {
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
			// Validate request
			if (
				!this.vendorACL.validateVendorLocationData({
					lat: request.location?.lat || 0,
					lng: request.location?.long || 0,
					vendorId: request.vendorId,
					updatedAt: new Date().toISOString(),
				})
			) {
				throw AppError.validation('INVALID_LOCATION_DATA', 'Invalid location data', {
					vendorId: request.vendorId,
				});
			}

			await this.vendorManagementService.updateVendorLocation(request);
			return {};
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error.message,
				location: request.location,
				vendorId: request.vendorId,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal('LOCATION_UPDATE_FAILED', 'Failed to update vendor location', {
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
			const vendors = await this.vendorManagementService.getVendorsInArea({
				neBounds: request.neLocation!,
				swBounds: request.swLocation!,
			});

			return { vendors };
		} catch (error) {
			this.logger.error('Failed to get vendors in area', {
				error: error.message,
				neBounds: request.neLocation,
				swBounds: request.swLocation,
			});

			if (error instanceof AppError) throw error;

			throw AppError.internal('LOCATION_QUERY_FAILED', 'Failed to get vendors in area', {
				neBounds: request.neLocation,
				swBounds: request.swLocation,
			});
		}
	}
}
