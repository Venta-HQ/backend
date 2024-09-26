import GrpcInstance from 'libs/nest/modules/grpc-instance/grpc-instance.service';
import { catchError, throwError } from 'rxjs';
import { AuthedRequest } from '@app/apitypes/lib/helpers';
import { CreateVendorSchema, UpdateVendorSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { CreateVendorData, UpdateVendorData } from '@app/apitypes/lib/vendor/vendor.types';
import { AuthGuard } from '@app/nest/guards';
import { SchemaValidatorPipe } from '@app/nest/pipes';
import { VENDOR_SERVICE_NAME, VendorServiceClient } from '@app/proto/vendor';
import { status } from '@grpc/grpc-js';
import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Inject,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	Param,
	Post,
	Put,
	Req,
	UseGuards,
	UsePipes,
} from '@nestjs/common';

@Controller()
export class VendorController {
	private readonly logger = new Logger(VendorController.name);

	constructor(@Inject(VENDOR_SERVICE_NAME) private client: GrpcInstance<VendorServiceClient>) {}

	@Get('/:id')
	// @UsePipes(AuthGuard)
	async getVendorById(@Param('id') id: string) {
		await this.client.invoke('getVendorById', { id }).pipe(
			catchError((error) => {
				if (error.code === status.NOT_FOUND) {
					this.logger.warn(error.message);
					return throwError(() => new NotFoundException('Item not found'));
				} else if (error.code === status.INVALID_ARGUMENT) {
					this.logger.warn(error.message);
					return throwError(() => new BadRequestException('Invalid query params provided'));
				} else {
					this.logger.error('Unhandled error occurred', error);
					return throwError(() => new InternalServerErrorException('An error occurred'));
				}
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
				catchError((error) => {
					if (error.code === status.INTERNAL) {
						this.logger.error(error.message, error.details);
						return throwError(() => new BadRequestException(error.message));
					}

					return throwError(() => new InternalServerErrorException('An error occurred'));
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
				catchError((error) => {
					this.logger.error(error.message, error.details);
					if (error.code === status.INTERNAL) {
						return throwError(() => new BadRequestException(error.message));
					}

					if (error.code === status.NOT_FOUND) {
						return throwError(() => new NotFoundException(error.message));
					}

					return throwError(() => new InternalServerErrorException('An error occurred'));
				}),
			);
	}
}
