import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { ClerkWebhooksService } from './clerk-webhooks.service';
import { SignedWebhookGuard } from '@/lib/guards/signed-webhook.guard';
import { WebhookEvent } from '@clerk/clerk-sdk-node';
import { WebhookResponse } from '@/lib/types/webhook';

@Controller()
export class ClerkWebhooksController {
  constructor(private readonly clerkService: ClerkWebhooksService) {}

  @Post()
  @UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SIGNING_SECRET))
  async handleEvents(@Body() body: WebhookEvent): Promise<WebhookResponse> {
    switch (body.type) {
      case 'user.created':
        await this.clerkService.handleUserCreated(body);
        break;
      case 'user.deleted':
        await this.clerkService.handleUserDeleted(body);
        break;
    }

    return { message: 'Success' };
  }
}
