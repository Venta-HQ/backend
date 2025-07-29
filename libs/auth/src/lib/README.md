# SignedWebhookGuard

A NestJS guard factory that creates guards for verifying webhook signatures using Svix.

## Features

- **Webhook Signature Verification**: Uses Svix to verify webhook payload signatures
- **Factory Pattern**: Returns a configured guard instance
- **Raw Body Support**: Works with raw request bodies for signature verification
- **Flexible Configuration**: Accepts different secrets for different webhook sources

## Usage

```typescript
import { SignedWebhookGuard } from '@app/nest/guards';

@Controller('webhooks')
export class WebhookController {
	@Post('clerk')
	@UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET))
	handleClerkWebhook(@Body() payload: any) {
		// Payload is verified to be from Clerk
		return this.processClerkWebhook(payload);
	}

	@Post('stripe')
	@UseGuards(SignedWebhookGuard(process.env.STRIPE_WEBHOOK_SECRET))
	handleStripeWebhook(@Body() payload: any) {
		// Payload is verified to be from Stripe
		return this.processStripeWebhook(payload);
	}
}
```

## Configuration

The guard factory requires a webhook secret that matches the one used by the webhook provider:

```typescript
// For Clerk webhooks
SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET);

// For Stripe webhooks
SignedWebhookGuard(process.env.STRIPE_WEBHOOK_SECRET);

// For any other webhook provider
SignedWebhookGuard(process.env.WEBHOOK_SECRET);
```

## How It Works

1. **Secret Configuration**: The factory function accepts a webhook secret
2. **Request Validation**: Checks for the presence of `rawBody` in the request
3. **Signature Verification**: Uses Svix to verify the webhook signature
4. **Access Control**: Returns `true` if signature is valid, `false` otherwise

## Requirements

- **Raw Body**: The request must have a `rawBody` property (usually set by middleware)
- **Valid Secret**: The webhook secret must match the one used by the webhook provider
- **Proper Headers**: Webhook signature headers must be present in the request

## Error Handling

- Returns `false` if `rawBody` is missing or undefined
- Returns `false` if signature verification fails
- Gracefully handles malformed webhook payloads

## Testing

See `signed-webhook.guard.test.ts` for comprehensive test coverage including:

- Valid webhook signatures
- Invalid webhook signatures
- Missing raw body scenarios
- Different webhook providers
- Error handling scenarios
