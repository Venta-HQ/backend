import GrpcInstance from 'libs/nest/modules/grpc-instance/grpc-instance.service';
import { catchError, throwError } from 'rxjs';
import { AuthedRequest } from '@app/apitypes/lib/helpers';
import { HttpError } from '@app/nest/errors';
import { AuthGuard } from '@app/nest/guards';
import { USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { status } from '@grpc/grpc-js';
import {
	BadRequestException,
	Controller,
	Get,
	Inject,
	InternalServerErrorException,
	Logger,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

@Controller()
export class UserController {
	private readonly logger = new Logger(UserController.name);

	constructor(@Inject(USER_SERVICE_NAME) private client: GrpcInstance<UserServiceClient>) {}

	@Get('/vendors')
	@UseGuards(AuthGuard)
	async getUserVendors(@Req() req: AuthedRequest) {
		return await this.client
			.invoke('getUserVendors', {
				userId: req.userId,
			})
			.pipe(
				catchError((error) => {
					if (error.code === status.INTERNAL) {
						this.logger.error(error.message, error.details);
						return throwError(() => new HttpError('API-00001')); // TODO: Handle different error types from GRPC
					}
					return throwError(() => new HttpError('API-00001'));
				}),
			);
	}
}
