import { VENDOR_SERVICE_NAME, VendorLookupByIdResponse, VendorLookupData } from '@app/proto/vendor';
import { status } from '@grpc/grpc-js';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(private readonly vendorService: VendorService) {}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	async getVendorById(data: VendorLookupData): Promise<VendorLookupByIdResponse> {
		if (!data.id) {
			this.logger.error(`No ID provided`);
			throw new RpcException({
				code: status.INVALID_ARGUMENT,
				message: `No ID provided`,
			});
		}

		const result = await this.vendorService.getVendorById(data.id);
		console.log(result);
		if (!result) {
			this.logger.error(`Vendor with ID ${data.id} not found`);
			throw new RpcException({
				code: status.NOT_FOUND,
				message: `Vendor with ID ${data.id} not found`,
			});
		}

		return {
			vendor: result,
		};
	}
}
