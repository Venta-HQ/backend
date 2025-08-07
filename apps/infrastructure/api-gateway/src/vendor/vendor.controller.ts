import { catchError, firstValueFrom } from 'rxjs';
import { AuthedRequest, CreateVendorData, CreateVendorSchema, UpdateVendorData } from '@app/apitypes';
import { AuthGuard } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { VENDOR_SERVICE_NAME, VendorServiceClient } from '@app/proto/vendor';
import { Body, Controller, Get, Inject, Param, Post, Put, Req, UseGuards, UsePipes } from '@nestjs/common';

@Controller()
export class VendorController {
	constructor(@Inject(VENDOR_SERVICE_NAME) private client: GrpcInstance<VendorServiceClient>) {}

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
	async createVendor(@Req() req: AuthedRequest, @Body() data: CreateVendorData) {
		return await firstValueFrom(
			this.client
				.invoke('createVendor', {
					...data,
					description: data.description ?? '',
					email: data.email ?? '',
					imageUrl: data.imageUrl ?? '',
					name: data.name ?? '',
					phone: data.phone ?? '',
					userId: req.userId,
					website: data.website ?? '',
				})
				.pipe(
					catchError((error: Error) => {
						// The AppExceptionFilter will handle the error conversion
						throw error;
					}),
				),
		);
	}

	@Put('/:id')
	@UseGuards(AuthGuard)
	async updateVendor(@Param('id') id: string, @Req() req: AuthedRequest, @Body() data: UpdateVendorData) {
		return await firstValueFrom(
			this.client
				.invoke('updateVendor', {
					...data,
					description: data.description ?? '',
					email: data.email ?? '',
					id,
					imageUrl: data.imageUrl ?? '',
					name: data.name ?? '',
					phone: data.phone ?? '',
					userId: req.userId,
					website: data.website ?? '',
				})
				.pipe(
					catchError((error: Error) => {
						// The AppExceptionFilter will handle the error conversion
						throw error;
					}),
				),
		);
	}
}
