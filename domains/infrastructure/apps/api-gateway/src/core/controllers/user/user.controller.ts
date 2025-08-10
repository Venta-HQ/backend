import { catchError, firstValueFrom } from 'rxjs';
import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { UserVendorRequestACL } from '@venta/domains/infrastructure/contracts';
import { AuthGuard } from '@venta/nest/guards';
import { GrpcInstance } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';

// Temporary interface until types are fully migrated
interface AuthedRequest {
	userId: string;
}

@Controller('users')
export class UserController {
	constructor(@Inject(USER_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<UserManagementServiceClient>) {}

	@Get('/vendors')
	@UseGuards(AuthGuard)
	async getUserVendors(@Req() req: AuthedRequest) {
		// Simple user ID to gRPC request - no complex ACL needed for this case
		const grpcData = { userId: req.userId };

		return await firstValueFrom(
			this.client.invoke('getUserVendors', grpcData).pipe(
				catchError((error: Error) => {
					// The AppExceptionFilter will handle the error conversion
					throw error;
				}),
			),
		);
	}
}
