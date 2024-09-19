import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const { auth } = request;

		if (!auth) {
			throw new UnauthorizedException('User not authenticated');
		}

		return true;
	}
}
