import { catchError, firstValueFrom } from 'rxjs';
import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedRequest } from '@venta/apitypes';
import { HttpAuthGuard } from '@venta/nest/guards';
import { GrpcInstance } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';

@Controller('user')
export class UserController {
	constructor(@Inject(USER_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<UserManagementServiceClient>) {}

	@Get('/vendor')
	@UseGuards(HttpAuthGuard)
	async getUserVendors(@Req() _req: AuthenticatedRequest) {
		return await firstValueFrom(
			this.client.invoke('getUserVendors', {}).pipe(
				catchError((error: Error) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			),
		);
	}
}
