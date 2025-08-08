import { randomUUID } from 'crypto';
import { AppError, ErrorCodes } from '@app/nest/errors';
import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../modules';
import { ClerkService } from '../../modules/external/clerk';
import { AuthContext, AuthProtocol, AuthUser } from '../types';

@Injectable()
export class GrpcAuthGuard implements CanActivate {
	private readonly logger = new Logger(GrpcAuthGuard.name);

	constructor(
		private readonly clerkService: ClerkService,
		private readonly prisma: PrismaService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const metadata = context.getArgByIndex(1); // gRPC metadata is the second argument
		const token = this.extractToken(metadata);

		if (!token) {
			this.logger.debug('No token found in gRPC metadata');
			throw new RpcException(new AppError('INVALID_TOKEN', ErrorCodes.INVALID_TOKEN));
		}

		try {
			// Use Clerk to verify the session token
			const tokenContents = await this.clerkService.verifyToken(token);

			// Find the user in our database
			const internalUser = await this.prisma.db.user.findFirst({
				select: {
					id: true,
					clerkId: true,
				},
				where: {
					clerkId: tokenContents.sub,
				},
			});

			if (!internalUser) {
				this.logger.warn(`User not found in database for clerk ID: ${tokenContents.sub}`);
				throw new RpcException(
					new AppError('USER_NOT_FOUND', ErrorCodes.USER_NOT_FOUND, { userId: tokenContents.sub }),
				);
			}

			// Create auth user and context
			const user: AuthUser = {
				id: internalUser.id,
				clerkId: internalUser.clerkId,
			};

			const authContext: AuthContext = {
				user,
				correlationId: metadata.get('x-correlation-id')?.[0]?.toString() || randomUUID(),
				timestamp: Date.now(),
				metadata: {
					protocol: AuthProtocol.GRPC,
					token,
				},
			};

			// Attach auth data to metadata
			metadata.set('user', JSON.stringify(user));
			metadata.set('authContext', JSON.stringify(authContext));

			return true;
		} catch (error) {
			// Log the specific error for debugging but don't expose it to the client
			if (error instanceof Error) {
				this.logger.error(`Authentication failed: ${error.message}`, error.stack, { error });
			} else {
				this.logger.error('Authentication failed with unknown error', error.stack, { error });
			}
			throw new RpcException(new AppError('INVALID_TOKEN', ErrorCodes.INVALID_TOKEN));
		}
	}

	private extractToken(metadata: any): string | null {
		// Try to get token from authorization metadata
		const auth = metadata.get('authorization')?.[0];
		if (auth?.startsWith('Bearer ')) {
			return auth.substring(7);
		}

		// Try to get token directly
		const token = metadata.get('token')?.[0];
		if (token) {
			return token;
		}

		return null;
	}
}
