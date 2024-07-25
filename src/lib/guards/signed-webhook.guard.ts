import { CanActivate, ExecutionContext, mixin } from '@nestjs/common';
import { Webhook } from 'svix';

export const SignedWebhookGuard = (secret: string) => {
  class SignedWebhookGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext) {
      const wh = new Webhook(secret);
      const request = context.switchToHttp().getRequest();
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
