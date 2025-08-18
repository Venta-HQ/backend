import { catchError, firstValueFrom } from 'rxjs';
import { Body, Controller, Get, Inject, Param, Post, Put, UseGuards, UsePipes } from '@nestjs/common';
import {
	IdParam,
	idParamSchema,
	VendorCreateBody,
	VendorCreateRequestACL,
	vendorCreateSchema,
	VendorUpdateBody,
	VendorUpdateRequestACL,
	vendorUpdateSchema,
} from '@venta/domains/infrastructure/contracts';
import { HttpAuthGuard } from '@venta/nest/guards';
import { GrpcInstance } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/validation';
import {
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorManagementServiceClient,
} from '@venta/proto/marketplace/vendor-management';

@Controller('vendor')
@UseGuards(HttpAuthGuard)
export class VendorController {
	constructor(@Inject(VENDOR_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<VendorManagementServiceClient>) {}

	@Get('/:id')
	@UsePipes(new SchemaValidatorPipe(idParamSchema))
	async getVendorById(@Param() params: IdParam) {
		return await firstValueFrom(
			this.client.invoke('getVendorById', { id: params.id }).pipe(
				catchError((error: Error) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			),
		);
	}

	@Post()
	@UsePipes(new SchemaValidatorPipe(vendorCreateSchema))
	async createVendor(@Body() data: VendorCreateBody) {
		// Validate and transform to gRPC
		const grpcData = VendorCreateRequestACL.toGrpc({
			name: data.name,
			description: data.description,
			email: data.email,
			phone: data.phone,
			website: data.website,
			profileImage: data.profileImage,
		});

		return await firstValueFrom(
			this.client.invoke('createVendor', grpcData).pipe(
				catchError((error: Error) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			),
		);
	}

	@Put('/:id')
	async updateVendor(
		@Param(new SchemaValidatorPipe(idParamSchema)) params: IdParam,
		@Body(new SchemaValidatorPipe(vendorUpdateSchema)) data: VendorUpdateBody,
	) {
		const grpcData = VendorUpdateRequestACL.toGrpc({
			id: params.id,
			name: data.name,
			description: data.description,
			email: data.email,
			phone: data.phone,
			website: data.website,
			profileImage: data.profileImage,
		});

		return await firstValueFrom(
			this.client.invoke('updateVendor', grpcData).pipe(
				catchError((error: Error) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			),
		);
	}
}
