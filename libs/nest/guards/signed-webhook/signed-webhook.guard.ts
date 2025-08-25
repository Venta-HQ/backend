import { Webhook } from 'svix';
import { CanActivate, ExecutionContext, mixin } from '@nestjs/common';
import { AppError, ErrorCodes } from '@venta/nest/errors';

export const SignedWebhookGuard = (secret: string) => {
	class SignedWebhookGuardMixin implements CanActivate {
		canActivate(context: ExecutionContext) {
			const request = context.switchToHttp().getRequest();
			const headers = request.headers;
			// Validate configuration
			if (!secret || typeof secret !== 'string' || secret.trim() === '') {
				throw AppError.internal(ErrorCodes.ERR_WEBHOOK_ERROR, {
					source: 'webhook',
					reason: 'missing_secret',
				} as any);
			}

			// Ensure raw body is available for signature verification
			const rawBody: Buffer | undefined = request.rawBody;
			if (!rawBody || !(rawBody instanceof Buffer)) {
				throw AppError.internal(ErrorCodes.ERR_WEBHOOK_ERROR, {
					source: 'webhook',
					reason: 'missing_raw_body',
				} as any);
			}

			try {
				const wh = new Webhook(secret);
				const payload = rawBody.toString('utf8');
				wh.verify(payload, headers);
				return true;
			} catch (err) {
				return false;
			}
		}
	}

	return mixin(SignedWebhookGuardMixin);
};
