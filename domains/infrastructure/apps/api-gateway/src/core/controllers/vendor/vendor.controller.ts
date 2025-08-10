import { catchError, firstValueFrom } from 'rxjs';
import { Body, Controller, Get, Inject, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { VendorCreateRequest, VendorCreateRequestACL } from '@venta/domains/infrastructure/contracts';
import { AuthenticatedRequest, AuthGuard } from '@venta/nest/guards';
import { GrpcInstance } from '@venta/nest/modules';
import {
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorManagementServiceClient,
} from '@venta/proto/marketplace/vendor-management';

@Controller('vendor')
export class VendorController {
	constructor(@Inject(VENDOR_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<VendorManagementServiceClient>) {}

	@Get('/:id')
	@UseGuards(AuthGuard)
	async getVendorById(@Param('id') id: string) {
		return await firstValueFrom(
			this.client.invoke('getVendorById', { id }).pipe(
				catchError((error: Error) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			),
		);
	}

	@Post()
	@UseGuards(AuthGuard)
	async createVendor(@Req() req: AuthenticatedRequest, @Body() data: VendorCreateRequest) {
		// Validate and transform to gRPC
		const grpcData = VendorCreateRequestACL.toGrpc({
			...data,
			userId: req.user.id,
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
	@UseGuards(AuthGuard)
	async updateVendor(
		@Param('id') id: string,
		@Req() req: AuthenticatedRequest,
		@Body() data: any, // TODO: Create VendorUpdateRequest type
	) {
		// For now, pass data directly as this needs a proper update ACL
		const grpcData = {
			...data,
			id,
			userId: req.userId,
		};

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
