import { catchError, firstValueFrom } from 'rxjs';
import { Body, Controller, Get, Inject, Param, Post, Put, Req, UseGuards, UsePipes } from '@nestjs/common';
import { VendorHttpACL } from '@venta/domains/infrastructure/contracts/anti-corruption-layers/vendor-http.acl';
import * as InfrastructureToMarketplaceContextMapper from '@venta/domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace.context-mapper';
import { CreateVendorSchema } from '@venta/domains/infrastructure/contracts/schemas/vendor/vendor.schemas';
import { AuthedRequest } from '@venta/domains/infrastructure/contracts/types';
import { Infrastructure } from '@venta/domains/infrastructure/contracts/types/context-mapping.types';
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { AuthGuard } from '@venta/nest/guards';
import { GrpcInstance } from '@venta/nest/modules';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import {
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorManagementServiceClient,
} from '@venta/proto/marketplace/vendor-management';

@Controller('vendors')
export class VendorController {
	private readonly contextMapper = InfrastructureToMarketplaceContextMapper;

	constructor(
		@Inject(VENDOR_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<VendorManagementServiceClient>,
		private readonly vendorACL: VendorHttpACL,
	) {}

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
	@UsePipes(new SchemaValidatorPipe(CreateVendorSchema))
	async createVendor(@Req() req: AuthedRequest, @Body() data: Infrastructure.Core.VendorCreateData) {
		try {
			// Validate request
			if (!this.vendorACL.validateVendorCreateData(data)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					message: 'Invalid vendor data',
					userId: req.userId,
				});
			}

			// Convert to gRPC request
			const grpcData = this.contextMapper.toMarketplaceVendorCreate({
				...data,
				userId: req.userId,
			});

			return await firstValueFrom(
				this.client.invoke('createVendor', grpcData).pipe(
					catchError((error: Error) => {
						// The AppExceptionFilter will handle the error conversion
						throw error;
					}),
				),
			);
		} catch (error) {
			this.vendorACL.handleVendorError(error, {
				operation: 'create_vendor',
				vendorId: undefined,
			});
		}
	}

	@Put('/:id')
	@UseGuards(AuthGuard)
	async updateVendor(
		@Param('id') id: string,
		@Req() req: AuthedRequest,
		@Body() data: Infrastructure.Core.VendorUpdateData,
	) {
		try {
			// Validate request
			if (!this.vendorACL.validateVendorUpdateData(data)) {
				throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
					message: 'Invalid vendor update data',
					userId: req.userId,
					vendorId: id,
				});
			}

			// Convert to gRPC request
			const grpcData = this.contextMapper.toMarketplaceVendorUpdate({
				...data,
				id,
				userId: req.userId,
			});

			return await firstValueFrom(
				this.client.invoke('updateVendor', grpcData).pipe(
					catchError((error: Error) => {
						// The AppExceptionFilter will handle the error conversion
						throw error;
					}),
				),
			);
		} catch (error) {
			this.vendorACL.handleVendorError(error, {
				operation: 'update_vendor',
				vendorId: id,
			});
		}
	}
}
