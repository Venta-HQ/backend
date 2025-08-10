import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserVendorQueryACL } from '@venta/domains/marketplace/contracts';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { GrpcAuthGuard } from '@venta/nest/guards';
// gRPC types (wire format)
import {
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	UserIdentityData,
	VendorList,
} from '@venta/proto/marketplace/user-management';
import { CoreService } from './core.service';

/**
 * Core gRPC controller for user-management operations
 * Handles core user-management operations (getUserVendors)
 */
@Controller()
@UseGuards(GrpcAuthGuard)
export class CoreController {
	private readonly logger = new Logger(CoreController.name);

	constructor(private readonly coreService: CoreService) {}

	@GrpcMethod(MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME, 'getUserVendors')
	async getUserVendors(request: UserIdentityData): Promise<VendorList> {
		// Validate and transform request
		const domainRequest = UserVendorQueryACL.toDomain(request);

		this.logger.debug('Retrieving user vendors', {
			userId: domainRequest.userId,
		});

		try {
			const vendors = await this.coreService.getUserVendors(domainRequest.userId);

			this.logger.debug('Retrieved user vendors successfully', {
				userId: domainRequest.userId,
				vendorCount: vendors.length,
			});

			return {
				vendors,
			};
		} catch (error) {
			this.logger.error('Failed to retrieve user vendors', {
				error: error.message,
				userId: domainRequest.userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_user_vendors',
				userId: domainRequest.userId,
			});
		}
	}
}
