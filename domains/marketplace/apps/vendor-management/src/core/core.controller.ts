import { Empty } from 'libs/proto/src/lib/shared/common';
import { Metadata } from '@grpc/grpc-js';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorCreateACL, VendorLookupACL, VendorUpdateACL } from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AuthenticatedGrpcContext } from '@venta/nest/guards';
import { GrpcRequestContext } from '@venta/nest/interceptors';
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
 * Note: gRPC auth is handled via interceptors, not guards
 */
@Controller()
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
			this.logger.error('Failed to get vendor', error.stack, {
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
	async createVendor(
		request: VendorCreateData,
		_metadata?: Metadata,
		@GrpcRequestContext() context?: AuthenticatedGrpcContext,
	): Promise<VendorIdentityData> {
		this.logger.debug('Creating new vendor');

		try {
			// Validate and transform request
			const domainRequest = VendorCreateACL.toDomain(request);

			const vendorId = await this.coreService.createVendor(domainRequest, context!.user.id);

			return { id: vendorId };
		} catch (error) {
			this.logger.error('Failed to create vendor', error.stack, {
				error: error.message,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'create_vendor',
			});
		}
	}

	@GrpcMethod(VENDOR_MANAGEMENT_SERVICE_NAME)
	async updateVendor(
		request: VendorUpdateData,
		_metadata?: Metadata,
		@GrpcRequestContext() context?: AuthenticatedGrpcContext,
	): Promise<Empty> {
		this.logger.debug('Updating vendor', { vendorId: request.id });

		try {
			// Validate and transform request
			const domainRequest = VendorUpdateACL.toDomain(request);

			await this.coreService.updateVendor(domainRequest, context!.user.id);

			return;
		} catch (error) {
			this.logger.error('Failed to update vendor', error.stack, {
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
