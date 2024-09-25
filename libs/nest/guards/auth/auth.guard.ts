import Redis from 'ioredis';
import { PrismaService } from '@app/nest/modules';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
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
			throw new UnauthorizedException('Missing authorization header');
		}

		const token = authHeader?.split(' ')[1];

		if (!token) {
			throw new UnauthorizedException('Malformed authorization header');
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
					throw new UnauthorizedException('No user corresponds with this auth id');
				}

				// Cache the result
				await this.redis.set(`user:${tokenContents.sub}`, internalUserId, 'EX', 3600); // 3600 = 1hr

				internalUserId = internalUser.id;
			}

			// Attach the Clerk user info to the request for further use
			request['userId'] = internalUserId;

			return true; // Allow access
		} catch (error) {
			// Log the error and deny access if token verification fails
			console.error('Invalid Clerk token:', error.message);
			throw new UnauthorizedException('Invalid or expired token');
		}
	}
}
