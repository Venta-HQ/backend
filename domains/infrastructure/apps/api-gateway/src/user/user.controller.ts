import { catchError } from 'rxjs';
import { AuthGuard } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@app/proto/marketplace/user-management';
import { AuthedRequest } from '@domains/infrastructure/contracts/types';
import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';

@Controller()
export class UserController {
	constructor(@Inject(USER_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<UserManagementServiceClient>) {}

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
