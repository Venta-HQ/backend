import GrpcInstance from 'libs/nest/modules/grpc-instance/grpc-instance.service';
import { catchError, firstValueFrom } from 'rxjs';
import { AuthedRequest } from '@app/apitypes/lib/helpers';
import { CreateVendorSchema, UpdateVendorSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { CreateVendorData, UpdateVendorData } from '@app/apitypes/lib/vendor/vendor.types';
import { AuthGuard } from '@app/nest/guards';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { VENDOR_SERVICE_NAME, VendorServiceClient } from '@app/proto/vendor';
import { Body, Controller, Get, Inject, Logger, Param, Post, Put, Req, UseGuards, UsePipes } from '@nestjs/common';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(@Inject(VENDOR_SERVICE_NAME) private client: GrpcInstance<VendorServiceClient>) {}

	@Get('/:id')
	@UseGuards(AuthGuard)
	async getVendorById(@Param('id') id: string) {
		const { vendor } = await firstValueFrom(
			this.client.invoke('getVendorById', { id }).pipe(
				catchError((error: any) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			),
		);

		let overrides = {};
		if (vendor.lat === 0 && vendor.long === 0) {
			overrides = {
				lat: null,
				long: null,
			};
		}

		return {
			vendor: {
				...vendor,
				...overrides,
			},
		};
	}

	@Post()
	@UseGuards(AuthGuard)
	@UsePipes(new SchemaValidatorPipe(CreateVendorSchema))
	async createVendor(@Body() data: CreateVendorData, @Req() req: AuthedRequest) {
		return this.client
			.invoke('createVendor', {
				description: data.description,
				email: data.email,
				imageUrl: data.imageUrl,
				name: data.name,
				phone: data.phone,
				userId: req.userId,
				website: data.website,
			})
			.pipe(
				catchError((error: any) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			);
	}

	@Put('/:id')
	@UseGuards(AuthGuard)
	async updateVendor(
		@Param('id') id: string,
		@Body(new SchemaValidatorPipe(UpdateVendorSchema)) data: UpdateVendorData,
		@Req() req: AuthedRequest,
	) {
		return await this.client
			.invoke('updateVendor', {
				description: data.description,
				email: data.email,
				id,
				imageUrl: data.imageUrl,
				name: data.name,
				phone: data.phone,
				userId: req.userId,
				website: data.website,
			})

			.pipe(
				catchError((error: any) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			);
	}
}
