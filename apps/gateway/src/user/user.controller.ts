import { catchError, throwError } from 'rxjs';
import { AuthedRequest } from '@app/apitypes/lib/helpers';
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
	OnModuleInit,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

@Controller()
export class UserController implements OnModuleInit {
	private readonly logger = new Logger(UserController.name);
	private userService: UserServiceClient;

	constructor(@Inject(USER_SERVICE_NAME) private client: ClientGrpc) {}

	onModuleInit() {
		this.userService = this.client.getService<UserServiceClient>(USER_SERVICE_NAME);
	}

	@Get('/vendors')
	@UseGuards(AuthGuard)
	async getUserVendors(@Req() req: AuthedRequest) {
		return await this.userService
			.getUserVendors({
				userId: req.userId,
			})
			.pipe(
				catchError((error) => {
					if (error.code === status.INTERNAL) {
						this.logger.error(error.message, error.details);
						return throwError(() => new BadRequestException(error.message));
					}
					return throwError(() => new InternalServerErrorException('An error occurred'));
				}),
			);
	}
}
