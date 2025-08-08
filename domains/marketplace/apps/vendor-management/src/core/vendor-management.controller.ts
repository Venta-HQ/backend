import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
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

	constructor(private readonly vendorManagementService: VendorManagementService) {}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'getVendorById')
	async getVendorById(request: VendorLookupByIdData): Promise<Vendor> {
		this.logger.debug('Getting vendor by ID', { vendorId: request.id });

		try {
			const vendor = await this.vendorManagementService.getVendorById(request.id);
			if (!vendor) {
				throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.VENDOR_NOT_FOUND, 'Vendor not found', {
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

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to get vendor', {
				vendorId: request.id,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'createVendor')
	async createVendor(request: VendorCreateData): Promise<VendorCreateResponse> {
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

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to create vendor', {
				userId: request.userId,
			});
		}
	}

	@GrpcMethod(MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME, 'updateVendor')
	async updateVendor(request: VendorUpdateData): Promise<VendorUpdateResponse> {
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

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to update vendor', {
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
			await this.vendorManagementService.updateVendorLocation(request);
			return {};
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				error: error.message,
				location: request.location,
				vendorId: request.vendorId,
			});

			if (error instanceof AppError) throw error;

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.LOCATION_UPDATE_FAILED, 'Failed to update vendor location', {
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

			throw new AppError(ErrorType.INTERNAL, ErrorCodes.LOCATION_QUERY_FAILED, 'Failed to get vendors in area', {
				neBounds: request.neLocation,
				swBounds: request.swLocation,
			});
		}
	}
}
