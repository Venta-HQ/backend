import { catchError, throwError } from 'rxjs';
import { AuthedRequest } from '@app/apitypes/lib/helpers';
import { CreateVendorSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { CreateVendorData } from '@app/apitypes/lib/vendor/vendor.types';
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
	OnModuleInit,
	Param,
	Post,
	Req,
	UseGuards,
	UsePipes,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

@Controller()
export class VendorController implements OnModuleInit {
	private readonly logger = new Logger(VendorController.name);
	private vendorService: VendorServiceClient;

	constructor(@Inject(VENDOR_SERVICE_NAME) private client: ClientGrpc) {}

	onModuleInit() {
		this.vendorService = this.client.getService<VendorServiceClient>(VENDOR_SERVICE_NAME);
	}

	@Get('/:id')
	async getVendorById(@Param('id') id: string) {
		return await this.vendorService
			.getVendorById({
				id,
			})
			.pipe(
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
		return await this.vendorService
			.createVendor({
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
}
