import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import {
	USER_MANAGEMENT_SERVICE_NAME,
	UserVendorData,
	UserVendorsResponse,
} from '@venta/proto/marketplace/user-management';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	constructor(private readonly vendorService: VendorService) {}

	@GrpcMethod(USER_MANAGEMENT_SERVICE_NAME)
	async getUserVendors(data: UserVendorData): Promise<UserVendorsResponse> {
		const vendors = await this.vendorService.getUserVendors(data.userId);

		if (!vendors) {
			throw AppError.notFound(ErrorCodes.USER_NOT_FOUND, { userId: data.userId });
		}

		return {
			vendors,
		};
	}
}
