import { catchError } from 'rxjs';
import { AuthGuard } from '@app/auth';
import GrpcInstance from '@app/grpc';
import {
	USER_SERVICE_NAME,
	UserCreateData,
	UserCreateResponse,
	UserLookupByIdResponse,
	UserLookupData,
	UserUpdateData,
	UserUpdateResponse,
} from '@app/proto/user';
import { Controller, Get, Inject, Logger, Req, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

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
