import { catchError } from 'rxjs';
import { AuthedRequest } from '@app/apitypes';
import { AuthGuard } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';

@Controller()
export class UserController {
	constructor(@Inject(USER_SERVICE_NAME) private client: GrpcInstance<UserServiceClient>) {}

	@Get('/vendors')
	@UseGuards(AuthGuard)
	async getUserVendors(@Req() req: AuthedRequest) {
		return await this.client
			.invoke('getUserVendors', {
				userId: req.userId,
			})
			.pipe(
				catchError((error: Error) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			)
			.toPromise();
	}
}
