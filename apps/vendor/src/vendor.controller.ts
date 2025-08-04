import { AppError, ErrorCodes } from '@app/nest/errors';
import { IEventsService } from '@app/nest/modules';
import {
	GrpcVendorCreateDataSchema,
	GrpcVendorLookupDataSchema,
	GrpcVendorUpdateDataSchema,
} from '@app/apitypes/lib/vendor/vendor.schemas';
import {
	VENDOR_SERVICE_NAME,
	VendorCreateData,
	VendorCreateResponse,
	VendorLookupByIdResponse,
	VendorLookupData,
	VendorUpdateData,
	VendorUpdateResponse,
} from '@app/proto/vendor';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { Controller, Inject, Logger, UsePipes } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { VendorService } from './vendor.service';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(
		private readonly vendorService: VendorService,
		@Inject('EventsService') private readonly eventsService: IEventsService,
	) {}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorLookupDataSchema))
	async getVendorById(data: VendorLookupData): Promise<VendorLookupByIdResponse> {
		if (!data.id) {
			this.logger.error(`No ID provided`);
			throw AppError.validation(ErrorCodes.MISSING_REQUIRED_FIELD, { field: 'id' });
		}

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
	@UsePipes(new SchemaValidatorPipe(GrpcVendorCreateDataSchema))
	async createVendor(data: VendorCreateData): Promise<VendorCreateResponse> {
		try {
			const id = await this.vendorService.createVendor(data);
			
			// Publish vendor created event
			await this.eventsService.publishEvent('vendor.created', {
				vendorId: id,
				userId: data.userId,
				data: data,
				timestamp: new Date().toISOString(),
			});

			return { id };
		} catch (e) {
			this.logger.error(`Error creating vendor with data`, {
				data,
			});
			throw AppError.internal('Could not create vendor', { entity: 'Vendor', originalError: e });
		}
	}

	@GrpcMethod(VENDOR_SERVICE_NAME)
	@UsePipes(new SchemaValidatorPipe(GrpcVendorUpdateDataSchema))
	async updateVendor(data: VendorUpdateData): Promise<VendorUpdateResponse> {
		try {
			const { id, userId, ...vendorUpdates } = data;
			await this.vendorService.updateVendor(id, userId, vendorUpdates);
			
			// Publish vendor updated event
			await this.eventsService.publishEvent('vendor.updated', {
				vendorId: id,
				userId: userId,
				updates: vendorUpdates,
				timestamp: new Date().toISOString(),
			});

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

			throw AppError.internal('Could not update vendor', { entity: 'Vendor', originalError: e });
		}
	}
}
