import { catchError, throwError } from 'rxjs';
import { VENDOR_SERVICE_NAME, VendorServiceClient } from '@app/proto/vendor';
import { status } from '@grpc/grpc-js';
import {
	BadRequestException,
	Controller,
	Get,
	Inject,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	OnModuleInit,
	Param,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

@Controller()
export class VendorController implements OnModuleInit {
	private readonly logger = new Logger(VendorController.name);
	private vendorService: VendorServiceClient;

	constructor(@Inject(VENDOR_SERVICE_NAME) private client: ClientGrpc) {}

	onModuleInit() {
		this.vendorService = this.client.getService<VendorServiceClient>('VendorService');
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
						// Transform gRPC NOT_FOUND error to HTTP 404
						return throwError(() => new NotFoundException('Item not found'));
					} else if (error.code === status.INVALID_ARGUMENT) {
						// Transform other gRPC errors to HTTP 400
						return throwError(() => new BadRequestException('Invalid query params provided'));
					} else {
						return throwError(() => new InternalServerErrorException('An error occurred'));
					}
				}),
			);
	}
}
