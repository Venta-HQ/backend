import { CreateVendorSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { GrpcSchemaValidatorPipe } from '@app/nest/pipes';
import {
	VENDOR_SERVICE_NAME,
	VendorCreateData,
	VendorCreateResponse,
	VendorLookupByIdResponse,
	VendorLookupData,
} from '@app/proto/vendor';
import { status } from '@grpc/grpc-js';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(private readonly vendorService: VendorService) {}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	async getVendorById(data: VendorLookupData): Promise<VendorLookupByIdResponse> {
		console.log('Getting vendor');
		if (!data.id) {
			this.logger.error(`No ID provided`);
			throw new RpcException({
				code: status.INVALID_ARGUMENT,
				message: `No ID provided`,
			});
		}

		const result = await this.vendorService.getVendorById(data.id);

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

	@UsePipes(new GrpcSchemaValidatorPipe(CreateVendorSchema))
	@GrpcMethod(VENDOR_SERVICE_NAME)
	async createVendor(data: VendorCreateData): Promise<VendorCreateResponse> {
		console.log('Creating vendor');
		try {
			const id = await this.vendorService.createVendor(data);
			return { id };
		} catch (e) {
			console.log(e);
			this.logger.error(`Error creating vendor with data`, {
				data,
			});
			throw new RpcException({
				code: status.INTERNAL,
				details: {
					data,
				},
				message: `Could not create vendor`,
			});
		}
	}
}
