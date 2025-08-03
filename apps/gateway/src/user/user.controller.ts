import { catchError } from 'rxjs';
import { AuthedRequest } from '@app/apitypes/lib/helpers';
import { AuthGuard } from '@app/auth';
import { GrpcInstance } from '@app/grpc';
import { USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';
import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import { ServiceDiscoveryService } from '../services/service-discovery.service';

@Controller()
export class UserController {
	constructor(
		@Inject(USER_SERVICE_NAME) private client: GrpcInstance<UserServiceClient>,
		private readonly serviceDiscovery: ServiceDiscoveryService,
	) {}

	@Get('/vendors')
	@UseGuards(AuthGuard)
	async getUserVendors(@Req() req: AuthedRequest) {
		return await this.serviceDiscovery.executeRequest('user-service', () =>
			this.client
				.invoke('getUserVendors', {
					userId: req.userId,
				})
				.pipe(
					catchError((error: Error) => {
						// The AppExceptionFilter will handle the error conversion
						throw error;
					}),
				)
				.toPromise(),
		);
	}
}
