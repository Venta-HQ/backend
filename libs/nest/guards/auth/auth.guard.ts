import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClerkService } from '../../modules/clerk/clerk.service';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly clerkService: ClerkService) {}

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

			// Attach the Clerk user info to the request for further use
			request['userId'] = tokenContents.sub;

			return true; // Allow access
		} catch (error) {
			// Log the error and deny access if token verification fails
			console.error('Invalid Clerk token:', error.message);
			throw new UnauthorizedException('Invalid or expired token');
		}
	}
}
