import {
	GrpcVendorCreateDataSchema,
	GrpcVendorLookupDataSchema,
	GrpcVendorUpdateDataSchema,
} from '@app/apitypes/lib/vendor/vendor.schemas';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import {
	VENDOR_SERVICE_NAME,
	VendorCreateData,
	VendorCreateResponse,
	VendorLookupByIdResponse,
	VendorLookupData,
	VendorUpdateData,
	VendorUpdateResponse,
} from '@app/proto/vendor';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(private readonly vendorService: VendorService) {}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorLookupDataSchema))
	async lookupVendorById(data: VendorLookupData): Promise<VendorLookupByIdResponse> {
		try {
			const vendor = await this.vendorService.lookupVendorById(data.id);
			return { vendor };
		} catch (e) {
			this.logger.error(`Error looking up vendor with id`, {
				id: data.id,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'lookup vendor' });
		}
	}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorCreateDataSchema))
	async createVendor(data: VendorCreateData): Promise<VendorCreateResponse> {
		try {
			const id = await this.vendorService.createVendor(data);
			return { id };
		} catch (e) {
			this.logger.error(`Error creating vendor with data`, {
				data,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'create vendor' });
		}
	}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorUpdateDataSchema))
	async updateVendor(data: VendorUpdateData): Promise<VendorUpdateResponse> {
		try {
			const vendor = await this.vendorService.updateVendor(data);
			return { vendor };
		} catch (e) {
			this.logger.error(`Error updating vendor with data`, {
				data,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update vendor' });
		}
	}
}
