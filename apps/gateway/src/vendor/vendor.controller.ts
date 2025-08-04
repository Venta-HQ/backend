import { catchError, firstValueFrom } from 'rxjs';
import { AuthedRequest, CreateVendorSchema, CreateVendorData, UpdateVendorData } from '@app/apitypes';
import { AuthGuard } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { VENDOR_SERVICE_NAME, VendorServiceClient } from '@app/proto/vendor';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { Body, Controller, Get, Inject, Param, Post, Put, Req, UseGuards, UsePipes } from '@nestjs/common';
import { ServiceDiscoveryService } from '../services/service-discovery.service';

@Controller()
export class VendorController {
	constructor(
		@Inject(VENDOR_SERVICE_NAME) private client: GrpcInstance<VendorServiceClient>,
		private readonly serviceDiscovery: ServiceDiscoveryService,
	) {}

	@Get('/:id')
	@UseGuards(AuthGuard)
	async getVendorById(@Param('id') id: string) {
		return await this.serviceDiscovery.executeRequest('vendor-service', () =>
			firstValueFrom(
				this.client.invoke('getVendorById', { id }).pipe(
					catchError((error: Error) => {
						// The AppExceptionFilter will handle the error conversion
						throw error;
					}),
				),
			),
		);
	}

	@Post()
	@UseGuards(AuthGuard)
	@UsePipes(new SchemaValidatorPipe(CreateVendorSchema))
	async createVendor(@Req() req: AuthedRequest, @Body() data: CreateVendorData) {
		return await this.serviceDiscovery.executeRequest('vendor-service', () =>
			firstValueFrom(
				this.client
					.invoke('createVendor', {
						...data,
						userId: req.userId,
						name: data.name ?? '',
						description: data.description ?? '',
						email: data.email ?? '',
						phone: data.phone ?? '',
						website: data.website ?? '',
						imageUrl: data.imageUrl ?? '',
					})
					.pipe(
						catchError((error: Error) => {
							// The AppExceptionFilter will handle the error conversion
							throw error;
						}),
					),
			),
		);
	}

	@Put('/:id')
	@UseGuards(AuthGuard)
	async updateVendor(@Param('id') id: string, @Req() req: AuthedRequest, @Body() data: UpdateVendorData) {
		return await this.serviceDiscovery.executeRequest('vendor-service', () =>
			firstValueFrom(
				this.client
					.invoke('updateVendor', {
						...data,
						id,
						userId: req.userId,
						name: data.name ?? '',
						description: data.description ?? '',
						email: data.email ?? '',
						phone: data.phone ?? '',
						website: data.website ?? '',
						imageUrl: data.imageUrl ?? '',
					})
					.pipe(
						catchError((error: Error) => {
							// The AppExceptionFilter will handle the error conversion
							throw error;
						}),
					),
			),
		);
	}
}
