import { Empty } from 'libs/proto/src/lib/shared/common';
import { Metadata } from '@grpc/grpc-js';
import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorCreateACL, VendorLookupACL, VendorUpdateACL } from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcAuthGuard } from '@venta/nest/guards';
import {
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorCreateData,
	VendorIdentityData,
	VendorLookupResponse,
	VendorManagementServiceController,
	VendorUpdateData,
} from '@venta/proto/marketplace/vendor-management';
import { LocationService } from '../location/location.service';
import { CoreService } from './core.service';

/**
 * gRPC controller for vendor management service
 * Implements the service interface generated from proto/marketplace/vendor-management.proto
 */
@Controller()
@UseGuards(GrpcAuthGuard)
export class CoreController implements VendorManagementServiceController {
	private readonly logger = new Logger(CoreController.name);

	constructor(
		private readonly coreService: CoreService,
		private readonly locationService: LocationService,
	) {}

	@GrpcMethod(VENDOR_MANAGEMENT_SERVICE_NAME)
	async getVendorById(request: VendorIdentityData): Promise<VendorLookupResponse> {
		this.logger.debug('Getting vendor by ID', { vendorId: request.id });

		try {
			// Validate and transform request
			const domainRequest = VendorLookupACL.toDomain(request);

			const vendor = await this.coreService.getVendorById(domainRequest.vendorId);

			if (!vendor) {
				throw AppError.notFound(ErrorCodes.ERR_ENTITY_NOT_FOUND, {
					entityType: 'vendor',
					entityId: request.id,
				});
			}

			return { vendor };
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

	@GrpcMethod(VENDOR_MANAGEMENT_SERVICE_NAME)
	async createVendor(request: VendorCreateData, metadata: Metadata): Promise<VendorIdentityData> {
		this.logger.debug('Creating new vendor');

		try {
			// Extract authenticated user from metadata
			const userMetadata = metadata.get('user')[0] as string;
			const authenticatedUser = JSON.parse(userMetadata);

			// Validate and transform request
			const domainRequest = VendorCreateACL.toDomain(request);

			const vendorId = await this.coreService.createVendor(domainRequest, authenticatedUser.id);

			return { id: vendorId };
		} catch (error) {
			this.logger.error('Failed to create vendor', {
				error: error.message,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_vendor',
			});
		}
	}

	@GrpcMethod(VENDOR_MANAGEMENT_SERVICE_NAME)
	async updateVendor(request: VendorUpdateData, metadata: Metadata): Promise<Empty> {
		this.logger.debug('Updating vendor', { vendorId: request.id });

		try {
			// Extract authenticated user from metadata
			const userMetadata = metadata.get('user')[0] as string;
			const authenticatedUser = JSON.parse(userMetadata);

			// Validate and transform request
			const domainRequest = VendorUpdateACL.toDomain(request);

			await this.coreService.updateVendor(domainRequest, authenticatedUser.id);

			return;
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
}
