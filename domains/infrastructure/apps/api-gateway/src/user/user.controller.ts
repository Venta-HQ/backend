import { catchError } from 'rxjs';
import { AuthGuard } from '@app/nest/guards';
import { GrpcInstance } from '@app/nest/modules';
import { USER_MANAGEMENT_SERVICE_NAME, UserManagementServiceClient } from '@app/proto/marketplace/user-management';
import { UserHttpACL } from '@domains/infrastructure/contracts/anti-corruption-layers/user-http-acl';
import { InfrastructureToMarketplaceContextMapper } from '@domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace-context-mapper';
import { Infrastructure } from '@domains/infrastructure/contracts/types/context-mapping.types';
import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';

type AuthedRequest = Infrastructure.Internal.AuthedRequest;

@Controller()
export class UserController {
	constructor(
		@Inject(USER_MANAGEMENT_SERVICE_NAME) private client: GrpcInstance<UserManagementServiceClient>,
		private readonly userACL: UserHttpACL,
		private readonly contextMapper: InfrastructureToMarketplaceContextMapper,
	) {}

	@Get('/vendors')
	@UseGuards(AuthGuard)
	async getUserVendors(@Req() req: AuthedRequest) {
		try {
			// Convert to gRPC request
			const grpcData = this.contextMapper.toGrpcUserVendorRequest(req.userId);

			return await this.client
				.invoke('getUserVendors', grpcData)
				.pipe(
					catchError((error: Error) => {
						// The AppExceptionFilter will handle the error conversion
						throw error;
					}),
				)
				.toPromise();
		} catch (error) {
			this.userACL.handleUserError(error, {
				operation: 'get_user_vendors',
				userId: req.userId,
			});
		}
	}
}
