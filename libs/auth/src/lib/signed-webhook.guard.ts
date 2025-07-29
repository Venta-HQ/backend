import { Webhook } from 'svix';
import { CanActivate, ExecutionContext, mixin } from '@nestjs/common';

export const SignedWebhookGuard = (secret: string) => {
	class SignedWebhookGuardMixin implements CanActivate {
		canActivate(context: ExecutionContext) {
			const wh = new Webhook(secret);
			const request = context.switchToHttp().getRequest();

			// Handle null/undefined rawBody
			if (!request.rawBody) {
				return false;
			}

			const payload = request.rawBody.toString('utf8');
			const headers = request.headers;

			try {
				wh.verify(payload, headers);
				return true;
			} catch (err) {
				return false;
			}
		}
	}

	return mixin(SignedWebhookGuardMixin);
};
