import { catchError, firstValueFrom } from 'rxjs';
import { Body, Controller, Get, Inject, Param, Post, Put, Req, UseGuards, UsePipes } from '@nestjs/common';
import { AuthenticatedRequest } from '@venta/apitypes';
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
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import {
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorManagementServiceClient,
} from '@venta/proto/marketplace/vendor-management';

@Controller('vendor')
export class VendorController {
	constructor(@Inject(VENDOR_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<VendorManagementServiceClient>) {}

	@Get('/:id')
	@UseGuards(HttpAuthGuard)
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
	@UseGuards(HttpAuthGuard)
	@UsePipes(new SchemaValidatorPipe(vendorCreateSchema))
	async createVendor(@Body() data: VendorCreateBody) {
		// Validate and transform to gRPC
		const grpcData = VendorCreateRequestACL.toGrpc({
			name: data.name,
			description: data.description || '',
			email: data.email,
			phone: data.phone || '',
			website: data.website || '',
			imageUrl: data.imageUrl,
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
	@UseGuards(HttpAuthGuard)
	async updateVendor(
		@Param(new SchemaValidatorPipe(idParamSchema)) params: IdParam,
		@Body(new SchemaValidatorPipe(vendorUpdateSchema)) data: VendorUpdateBody,
	) {
		const grpcData = VendorUpdateRequestACL.toGrpc({
			id: params.id,
			name: data.name || '',
			description: data.description || '',
			email: data.email || '',
			phone: data.phone || '',
			website: data.website || '',
			imageUrl: data.imageUrl || '',
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
