import { Controller, Logger, Post, UseGuards, Body } from '@nestjs/common';
import { ClerkWebhooksService } from './clerk-webhooks.service';
import { SignedWebhookGuard } from '@/lib/guards/signed-webhook.guard';
import { WebhookEvent } from '@clerk/clerk-sdk-node';
import { WebhookResponse } from '@/lib/types/webhook';

@Controller()
export class ClerkWebhooksController {
  private readonly logger = new Logger(ClerkWebhooksController.name);
  constructor(private readonly clerkService: ClerkWebhooksService) {}

  @Post()
  @UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SIGNING_SECRET))
  async handleEvents(@Body() body: WebhookEvent): Promise<WebhookResponse> {
    this.logger.log(`Handling Clerk Webhook Event: ${body.type}`);
    switch (body.type) {
      case 'user.created':
        await this.clerkService.handleUserCreated(body);
        break;
      case 'user.deleted':
        await this.clerkService.handleUserDeleted(body);
        break;
      default:
        this.logger.warn('Unhandled Event Type');
    }

    return { message: 'Success' };
  }
}
