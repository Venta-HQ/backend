import { GrpcVendorCreateDataSchema, GrpcVendorUpdateDataSchema } from '@app/apitypes';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import {
	Vendor,
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorCreateData,
	VendorCreateResponse,
	VendorLookupByIdData,
	VendorLookupByIdResponse,
	VendorUpdateData,
	VendorUpdateResponse,
} from '@app/proto/marketplace/vendor-management';
import { Controller, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(private readonly vendorService: VendorService) {}

	@GrpcMethod(VENDOR_MANAGEMENT_SERVICE_NAME)
	async getVendorById(data: VendorLookupByIdData): Promise<VendorLookupByIdResponse> {
		try {
			const vendor = await this.vendorService.getVendorById(data.id);

			// Convert Prisma vendor to proto Vendor type
			const protoVendor: Vendor = {
				createdAt: vendor.createdAt.toISOString(),
				description: vendor.description || '',
				email: vendor.email || '',
				id: vendor.id,
				location: {
					lat: vendor.lat || 0,
					long: vendor.long || 0,
				},
				name: vendor.name,
				open: vendor.open,
				phone: vendor.phone || '',
				primaryImage: vendor.primaryImage || '',
				updatedAt: vendor.updatedAt.toISOString(),
				website: vendor.website || '',
			};

			return { vendor: protoVendor };
		} catch (e) {
			// Handle vendor not found case gracefully for backward compatibility
			if (e instanceof AppError && e.code === ErrorCodes.VENDOR_NOT_FOUND) {
				return { vendor: undefined };
			}

			this.logger.error(`Error looking up vendor with id`, {
				id: data.id,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'lookup vendor' });
		}
	}

	@GrpcMethod(VENDOR_MANAGEMENT_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorCreateDataSchema))
	async createVendor(data: VendorCreateData): Promise<VendorCreateResponse> {
		try {
			// Convert gRPC data to service onboarding data
			const onboardingData = {
				description: data.description,
				email: data.email,
				name: data.name,
				ownerId: data.userId,
				phone: data.phone,
				primaryImage: data.imageUrl,
				website: data.website,
			};

			const id = await this.vendorService.onboardVendor(onboardingData);
			return { id };
		} catch (e) {
			this.logger.error(`Error creating vendor with data`, {
				data,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'create vendor' });
		}
	}

	@GrpcMethod(VENDOR_MANAGEMENT_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorUpdateDataSchema))
	async updateVendor(data: VendorUpdateData): Promise<VendorUpdateResponse> {
		try {
			// Convert gRPC data to service update data
			const updateData = {
				description: data.description,
				email: data.email,
				name: data.name,
				phone: data.phone,
				primaryImage: data.imageUrl,
				website: data.website,
			};

			await this.vendorService.updateVendor(data.id, updateData);
			return { message: 'Vendor updated successfully', success: true };
		} catch (e) {
			this.logger.error(`Error updating vendor with data`, {
				data,
			});
			throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: 'update vendor' });
		}
	}
}
