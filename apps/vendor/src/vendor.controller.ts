import {
	GrpcVendorCreateDataSchema,
	GrpcVendorLookupDataSchema,
	GrpcVendorUpdateDataSchema,
} from '@app/apitypes/lib/vendor/vendor.schemas';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { GrpcSchemaValidatorPipe } from '@app/nest/pipes';
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
	@UsePipes(new GrpcSchemaValidatorPipe(GrpcVendorLookupDataSchema))
	async getVendorById(data: VendorLookupData): Promise<VendorLookupByIdResponse> {
		const result = await this.vendorService.getVendorById(data.id);

		if (!result) {
			this.logger.error(`Vendor with ID ${data.id} not found`);
			throw AppError.notFound(ErrorCodes.VENDOR_NOT_FOUND, { vendorId: data.id });
		}

		return {
			vendor: result,
		};
	}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	@UsePipes(new GrpcSchemaValidatorPipe(GrpcVendorCreateDataSchema))
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
	@UsePipes(new GrpcSchemaValidatorPipe(GrpcVendorUpdateDataSchema))
	async updateVendor(data: VendorUpdateData): Promise<VendorUpdateResponse> {
		try {
			const { id, userId, ...vendorUpdates } = data;
			await this.vendorService.updateVendor(id, userId, vendorUpdates);
			return {
				message: 'Updated vendor',
				success: true,
			};
		} catch (e) {
			this.logger.error(`Error updating vendor with data`, {
				data,
			});

			if (e instanceof AppError) {
				throw e;
			}

			throw AppError.internal(ErrorCodes.DATABASE_ERROR, {
				operation: 'update vendor',
			});
		}
	}
}
