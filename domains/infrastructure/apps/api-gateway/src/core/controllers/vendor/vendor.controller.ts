import { catchError, firstValueFrom } from 'rxjs';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { AuthGuard } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import {
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorManagementServiceClient,
} from '@app/proto/marketplace/vendor-management';
import { VendorHttpACL } from '@domains/infrastructure/contracts/anti-corruption-layers/vendor-http-acl';
import { InfrastructureToMarketplaceContextMapper } from '@domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace-context-mapper';
import { Infrastructure } from '@domains/infrastructure/contracts/types/context-mapping.types';
import { CreateVendorSchema } from '@domains/infrastructure/contracts/types/vendor/vendor.schemas';
import { Body, Controller, Get, Inject, Param, Post, Put, Req, UseGuards, UsePipes } from '@nestjs/common';

type AuthedRequest = Infrastructure.Internal.AuthedRequest;

@Controller('vendors')
export class VendorController {
	constructor(
		@Inject(VENDOR_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<VendorManagementServiceClient>,
		private readonly vendorACL: VendorHttpACL,
		private readonly contextMapper: InfrastructureToMarketplaceContextMapper,
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
				throw AppError.validation(ErrorCodes.ERR_VENDOR_INVALID_DATA, {
					userId: req.userId,
				});
			}

			// Convert to gRPC request
			const grpcData = this.contextMapper.toGrpcVendorCreateData(data, req.userId);

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
				throw AppError.validation(ErrorCodes.ERR_VENDOR_INVALID_DATA, {
					userId: req.userId,
					vendorId: id,
				});
			}

			// Convert to gRPC request
			const grpcData = this.contextMapper.toGrpcVendorUpdateData(data, id, req.userId);

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
