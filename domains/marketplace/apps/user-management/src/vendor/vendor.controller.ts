import { Empty } from 'libs/proto/src/lib/shared/common';
import { Metadata } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { Logger } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, VendorList } from '@venta/proto/marketplace/user-management';
import { extractGrpcRequestMetadata } from '@venta/utils';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	constructor(
		private readonly vendorService: VendorService,
		private readonly logger: Logger,
	) {
		this.logger.setContext(VendorController.name);
	}

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	async getUserVendors(_request: Empty, metadata: Metadata): Promise<VendorList> {
		const context = extractGrpcRequestMetadata(metadata);
		const userId = context.user!.id;

		this.logger.debug('Retrieving user vendors', {
			userId,
		});

		try {
			const vendors = await this.vendorService.getUserVendors(userId);

			this.logger.debug('Retrieved user vendors successfully', {
				userId,
				vendorCount: vendors.length,
			});

			return {
				vendors,
			};
		} catch (error) {
			this.logger.error('Failed to retrieve user vendors', (error as Error).stack, {
				error: (error as Error).message,
				userId,
			});

			if (error instanceof AppError) throw error;
			throw AppError.internal(ErrorCodes.ERR_DB_OPERATION, {
				operation: 'get_user_vendors',
				userId,
			});
		}
	}
}
