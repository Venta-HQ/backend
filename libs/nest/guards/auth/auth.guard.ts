import Redis from 'ioredis';
import { HttpError } from '@app/nest/errors';
import { PrismaService } from '@app/nest/modules';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ClerkService } from '../../modules/clerk/clerk.service';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly clerkService: ClerkService,
		private prisma: PrismaService,
		@InjectRedis() private redis: Redis,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		// Extract token from Authorization header (format: Bearer <token>)
		const authHeader = request.headers['authorization'];

						if (!authHeader) {
					throw new HttpError('UNAUTHORIZED');
				}

		const token = authHeader?.split(' ')[1];

						if (!token) {
					throw new HttpError('UNAUTHORIZED');
				}

		try {
			// Use Clerk to verify the session token
			const tokenContents = await this.clerkService.verifyToken(token);

			// Fetch our user using a redis cache to avoid overfetching
			let internalUserId = await this.redis.get(`user:${tokenContents.sub}`);

			if (!internalUserId) {
				const internalUser = await this.prisma.db.user.findFirst({
					select: {
						id: true,
					},
					where: {
						clerkId: tokenContents.sub,
					},
				});

												if (!internalUser) {
									throw new HttpError('UNAUTHORIZED');
								}

				// Cache the result
				await this.redis.set(`user:${tokenContents.sub}`, internalUserId, 'EX', 3600); // 3600 = 1hr

				internalUserId = internalUser.id;
			}

			// Attach the Clerk user info to the request for further use
			request['userId'] = internalUserId;

			return true; // Allow access
		} catch (error) {
			throw new HttpError('UNAUTHORIZED');
		}
	}
}
