import { ErrorCodes, AppError } from '@app/nest/errors';
import { USER_SERVICE_NAME, UserVendorData, UserVendorsResponse } from '@app/proto/user';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(private readonly vendorService: VendorService) {}

	@GrpcMethod(USER_SERVICE_NAME)
	async getUserVendors(data: UserVendorData): Promise<UserVendorsResponse> {
		const vendors = await this.vendorService.getUserVendors(data.userId);

		if (!vendors) {
			throw AppError.notFound(
				ErrorCodes.USER_NOT_FOUND,
				{ userId: data.userId }
			);
		}

		return {
			vendors,
		};
	}
}
