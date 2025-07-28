import { ErrorCodes, AppError } from '@app/nest/errors';
import { GrpcSchemaValidatorPipe } from '@app/nest/pipes';
import { USER_SERVICE_NAME, UserVendorData, UserVendorsResponse } from '@app/proto/user';
import { GrpcUserVendorDataSchema } from '@app/apitypes/lib/user/user.schemas';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(private readonly vendorService: VendorService) {}

	@GrpcMethod(USER_SERVICE_NAME)
	@UsePipes(new GrpcSchemaValidatorPipe(GrpcUserVendorDataSchema))
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
