import GrpcInstance from 'libs/nest/modules/grpc-instance/grpc-instance.service';
import { catchError, throwError } from 'rxjs';
import { AuthedRequest } from '@app/apitypes/lib/helpers';
import { CreateVendorSchema, UpdateVendorSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { CreateVendorData, UpdateVendorData } from '@app/apitypes/lib/vendor/vendor.types';
import { GrpcError, HttpError } from '@app/nest/errors';
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
		return await this.client.invoke('getVendorById', { id }).pipe(
			catchError((error: GrpcError) => {
				if (error.errorCode) {
					throw new HttpError(error.errorCode, null, error.message);
				}
				return throwError(() => new HttpError('API-00001'));
			}),
		);
	}

	@Post()
	@UseGuards(AuthGuard)
	@UsePipes(new SchemaValidatorPipe(CreateVendorSchema))
	async createVendor(@Body() data: CreateVendorData, @Req() req: AuthedRequest) {
		return await this.client
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
				catchError((error: GrpcError) => {
					if (error.errorCode) {
						throw new HttpError(error.errorCode, null, error.message);
					}
					return throwError(() => new HttpError('API-00001'));
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
				catchError((error: GrpcError) => {
					if (error.errorCode) {
						throw new HttpError(error.errorCode, null, error.message);
					}
					return throwError(() => new HttpError('API-00001'));
				}),
			);
	}
}
