# Signed Webhook Guard

## Purpose

The Signed Webhook Guard provides webhook signature verification for external integrations in the Venta backend system. It validates webhook signatures from external services like Stripe, Clerk, and other third-party providers to ensure request authenticity and security.

## Overview

This guard provides:

- Webhook signature verification and validation
- HMAC signature verification for secure webhook requests
- Support for multiple webhook providers (Stripe, Clerk, etc.)
- Security protection against unauthorized webhook requests
- Custom webhook validation logic support
- Error handling for signature verification failures

## Usage

### Basic Webhook Protection

Protect webhook endpoints with signature verification:

```typescript
import { SignedWebhookGuard } from '@venta/nest/guards/signed-webhook';

@Controller('webhooks')
export class WebhookController {
	@Post('stripe')
	@UseGuards(SignedWebhookGuard)
	async handleStripeWebhook(@Body() data: any, @Headers() headers: any) {
		return this.paymentService.processStripeWebhook(data);
	}
}
```

### Controller-Level Protection

Protect entire webhook controllers:

```typescript
@Controller('webhooks')
@UseGuards(SignedWebhookGuard)
export class WebhookController {
	@Post('stripe')
	async handleStripeWebhook(@Body() data: any, @Headers() headers: any) {
		return this.paymentService.processStripeWebhook(data);
	}

	@Post('clerk')
	async handleClerkWebhook(@Body() data: any, @Headers() headers: any) {
		return this.authService.processClerkWebhook(data);
	}

	@Post('subscription')
	async handleSubscriptionWebhook(@Body() data: any, @Headers() headers: any) {
		return this.subscriptionService.processWebhook(data);
	}
}
```

### Mixed Protection

Protect specific endpoints while leaving others public:

```typescript
@Controller('webhooks')
export class WebhookController {
	// Public endpoint for testing
	@Post('test')
	async handleTestWebhook(@Body() data: any) {
		return this.testService.processTestWebhook(data);
	}

	// Protected webhook endpoint
	@Post('stripe')
	@UseGuards(SignedWebhookGuard)
	async handleStripeWebhook(@Body() data: any, @Headers() headers: any) {
		return this.paymentService.processStripeWebhook(data);
	}

	// Protected webhook with custom validation
	@Post('custom')
	@UseGuards(SignedWebhookGuard)
	async handleCustomWebhook(@Body() data: any, @Headers() headers: any) {
		// Additional custom validation
		if (!data.eventType) {
			throw new AppError('Event type is required', ErrorCodes.BAD_REQUEST);
		}
		return this.customService.processWebhook(data);
	}
}
```

### Custom Webhook Guard

Extend the guard for custom validation logic:

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { SignedWebhookGuard } from '@venta/nest/guards/signed-webhook';

@Injectable()
export class CustomWebhookGuard extends SignedWebhookGuard {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		// First, perform standard signature verification
		const isSignatureValid = await super.canActivate(context);
		if (!isSignatureValid) {
			return false;
		}

		// Add custom validation logic
		const request = context.switchToHttp().getRequest();
		const body = request.body;
		const headers = request.headers;

		// Check IP address restrictions
		const clientIp = request.ip;
		const allowedIps = ['192.168.1.1', '10.0.0.1'];
		if (!allowedIps.includes(clientIp)) {
			throw new AppError('Webhook from unauthorized IP', ErrorCodes.FORBIDDEN);
		}

		// Check webhook timestamp
		const webhookTimestamp = headers['webhook-timestamp'];
		const currentTime = Date.now();
		const maxAge = 5 * 60 * 1000; // 5 minutes
		if (currentTime - webhookTimestamp > maxAge) {
			throw new AppError('Webhook too old', ErrorCodes.BAD_REQUEST);
		}

		return true;
	}
}
```

### Multiple Webhook Providers

Handle different webhook providers with specific validation:

```typescript
@Controller('webhooks')
export class WebhookController {
	// Stripe webhooks
	@Post('stripe/payment')
	@UseGuards(SignedWebhookGuard)
	async handleStripePayment(@Body() data: any, @Headers() headers: any) {
		return this.paymentService.processStripePayment(data);
	}

	@Post('stripe/subscription')
	@UseGuards(SignedWebhookGuard)
	async handleStripeSubscription(@Body() data: any, @Headers() headers: any) {
		return this.subscriptionService.processStripeSubscription(data);
	}

	// Clerk webhooks
	@Post('clerk/user')
	@UseGuards(SignedWebhookGuard)
	async handleClerkUser(@Body() data: any, @Headers() headers: any) {
		return this.authService.processClerkUser(data);
	}

	// Custom service webhooks
	@Post('custom/analytics')
	@UseGuards(SignedWebhookGuard)
	async handleAnalyticsWebhook(@Body() data: any, @Headers() headers: any) {
		return this.analyticsService.processWebhook(data);
	}
}
```

### Error Handling

Handle webhook signature verification errors:

```typescript
@Controller('webhooks')
export class WebhookController {
	@Post('stripe')
	@UseGuards(SignedWebhookGuard)
	async handleStripeWebhook(@Body() data: any, @Headers() headers: any) {
		try {
			return await this.paymentService.processStripeWebhook(data);
		} catch (error) {
			// Log webhook processing errors
			this.logger.error('Webhook processing failed', { error: error.message });

			// Return appropriate error response
			throw new AppError('Webhook processing failed', ErrorCodes.INTERNAL_SERVER_ERROR);
		}
	}
}
```

### Environment Configuration

Configure webhook signature verification:

```env
# Webhook Configuration
WEBHOOK_STRIPE_SECRET=whsec_your_stripe_webhook_secret
WEBHOOK_CLERK_SECRET=whsec_your_clerk_webhook_secret
WEBHOOK_CUSTOM_SECRET=your_custom_webhook_secret

# Security Settings
WEBHOOK_SIGNATURE_TIMEOUT=300000
WEBHOOK_MAX_AGE=300000
WEBHOOK_ALLOWED_IPS=192.168.1.1,10.0.0.1
```

## Key Benefits

- **Security**: Ensures webhook requests come from authorized sources
- **Verification**: Validates webhook signatures to prevent tampering
- **Flexibility**: Supports multiple webhook providers and signature methods
- **Reliability**: Prevents unauthorized webhook processing
- **Customization**: Extensible for custom validation logic
- **Error Handling**: Comprehensive error handling for verification failures

## Dependencies

- **NestJS** for guard framework and dependency injection
- **Crypto** for signature verification and HMAC validation
- **TypeScript** for type definitions
