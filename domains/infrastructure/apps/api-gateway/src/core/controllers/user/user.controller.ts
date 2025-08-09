import { catchError, firstValueFrom } from 'rxjs';
import { UserHttpACL } from '@domains/infrastructure/contracts/anti-corruption-layers/user-http.acl';
import * as InfrastructureToMarketplaceContextMapper from '@domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace.context-mapper';
import { AuthedRequest } from '@domains/infrastructure/contracts/types';
import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@venta/nest/guards';
import { GrpcInstance } from '@venta/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@venta/proto/marketplace/user-management';

@Controller('users')
export class UserController {
	private readonly contextMapper = InfrastructureToMarketplaceContextMapper;
	constructor(
		@Inject(USER_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<UserManagementServiceClient>,
		private readonly userACL: UserHttpACL,
	) {}

	@Get('/vendors')
	@UseGuards(AuthGuard)
	async getUserVendors(@Req() req: AuthedRequest) {
		try {
			// Convert to gRPC request
			const grpcData = this.contextMapper.toGrpcUserVendorRequest(req.userId);

			return await firstValueFrom(
				this.client.invoke('getUserVendors', grpcData).pipe(
					catchError((error: Error) => {
						// The AppExceptionFilter will handle the error conversion
						throw error;
					}),
				),
			);
		} catch (error) {
			this.userACL.handleUserError(error, {
				operation: 'get_user_vendors',
				userId: req.userId,
			});
		}
	}
}
