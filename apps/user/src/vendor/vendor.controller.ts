import { GrpcVendorCreateDataSchema, GrpcVendorUpdateDataSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { AppError, ErrorCodes } from '@app/errors';
import {
	USER_SERVICE_NAME,
	VendorCreateData,
	VendorCreateResponse,
	VendorUpdateData,
	VendorUpdateResponse,
} from '@app/proto/user';
import { SchemaValidatorPipe } from '@app/validation';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(private readonly vendorService: VendorService) {}

	@GrpcMethod(USER_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcUserVendorDataSchema))
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
