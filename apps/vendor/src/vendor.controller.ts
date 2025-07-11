import { GrpcError } from '@app/nest/errors';
import {
	VENDOR_SERVICE_NAME,
	VendorCreateData,
	VendorCreateResponse,
	VendorLookupByIdResponse,
	VendorLookupData,
	VendorUpdateData,
	VendorUpdateResponse,
} from '@app/proto/vendor';
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(private readonly vendorService: VendorService) {}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	async getVendorById(data: VendorLookupData): Promise<VendorLookupByIdResponse> {
		if (!data.id) {
			this.logger.error(`No ID provided`);
			throw new GrpcError('API-00004', { message: 'No ID provided' });
		}

		const result = await this.vendorService.getVendorById(data.id);

		if (!result) {
			this.logger.error(`Vendor with ID ${data.id} not found`);
			throw new GrpcError('API-00003', { entity: 'Vendor' });
		}

		return {
			vendor: result,
		};
	}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	async createVendor(data: VendorCreateData): Promise<VendorCreateResponse> {
		try {
			const id = await this.vendorService.createVendor(data);
			return { id };
		} catch (e) {
			this.logger.error(`Error creating vendor with data`, {
				data,
			});
			throw new GrpcError('API-00005', { entity: 'Vendor' });
		}
	}

	@GrpcMethod(VENDOR_SERVICE_NAME)
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

			if (e instanceof GrpcError) {
				throw e;
			}

			throw new GrpcError('API-00006', { entity: 'Vendor' });
		}
	}
}
