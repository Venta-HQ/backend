import { GrpcVendorCreateDataSchema, GrpcVendorLookupDataSchema, GrpcVendorUpdateDataSchema } from '@app/apitypes';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import {
	Vendor,
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
			const vendor = await this.vendorService.getVendorById(data.id);
			if (!vendor) {
				return { vendor: undefined };
			}

			// Convert Prisma vendor to proto Vendor type
			const protoVendor: Vendor = {
				createdAt: vendor.createdAt,
				description: vendor.description || '',
				email: vendor.email || '',
				id: vendor.id,
				lat: vendor.lat || 0,
				long: vendor.long || 0,
				name: vendor.name,
				open: vendor.open,
				phone: vendor.phone || '',
				primaryImage: vendor.primaryImage || '',
				updatedAt: vendor.updatedAt,
				website: vendor.website || '',
			};

			return { vendor: protoVendor };
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
			await this.vendorService.updateVendor(data.id, data.userId, data);
			return { message: 'Vendor updated successfully', success: true };
		} catch (e) {
			this.logger.error(`Error updating vendor with data`, {
				data,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update vendor' });
		}
	}
}
