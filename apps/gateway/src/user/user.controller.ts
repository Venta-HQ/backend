import GrpcInstance from 'libs/nest/modules/grpc-instance/grpc-instance.service';
import { catchError, throwError } from 'rxjs';
import { AuthedRequest } from '@app/apitypes/lib/helpers';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { AuthGuard } from '@app/nest/guards';
import { USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Controller, Get, Inject, Logger, Req, UseGuards } from '@nestjs/common';

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
				catchError((error: any) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			);
	}
}
