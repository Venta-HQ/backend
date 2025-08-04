# Signed Webhook Guard

## Purpose

The Signed Webhook Guard provides webhook signature verification for external integrations in the Venta backend system. It validates webhook signatures from external services like Stripe, Clerk, and other third-party providers to ensure request authenticity and security.

## What It Contains

- **SignedWebhookGuard**: Main webhook signature verification guard
- **Signature Validation**: HMAC signature verification for webhook requests
- **Security Protection**: Ensures webhook requests come from authorized sources

## Usage

This guard is used to protect webhook endpoints and verify that requests come from legitimate external services.

### Basic Usage
```typescript
// Import the signed webhook guard
import { SignedWebhookGuard } from '@app/nest/guards/signed-webhook';

@Controller('webhooks')
export class WebhookController {
  @Post('stripe')
  @UseGuards(SignedWebhookGuard)
  async handleStripeWebhook(@Body() data: any, @Headers() headers: any) {
    return this.paymentService.processStripeWebhook(data);
  }
}
```

### Protecting Multiple Webhook Endpoints
```typescript
// Protect entire webhook controller
import { SignedWebhookGuard } from '@app/nest/guards/signed-webhook';

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
```typescript
// Some endpoints protected, others public
import { SignedWebhookGuard } from '@app/nest/guards/signed-webhook';

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

  // Protected webhook endpoint with custom logic
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

### Accessing Webhook Data
```typescript
// Access webhook data and headers
import { SignedWebhookGuard } from '@app/nest/guards/signed-webhook';

@Controller('webhooks')
@UseGuards(SignedWebhookGuard)
export class WebhookController {
  @Post('stripe')
  async handleStripeWebhook(@Body() data: any, @Headers() headers: any) {
    const signature = headers['stripe-signature'];
    const eventType = data.type;
    const eventId = data.id;
    
    console.log(`Processing Stripe webhook: ${eventType} (${eventId})`);
    
    return this.paymentService.processStripeWebhook(data);
  }

  @Post('clerk')
  async handleClerkWebhook(@Body() data: any, @Headers() headers: any) {
    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    const svixSignature = headers['svix-signature'];
    
    console.log(`Processing Clerk webhook: ${svixId} at ${svixTimestamp}`);
    
    return this.authService.processClerkWebhook(data);
  }
}
```

### Custom Webhook Guard
```typescript
// Extend signed webhook guard for custom logic
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { SignedWebhookGuard } from '@app/nest/guards/signed-webhook';

@Injectable()
export class CustomWebhookGuard extends SignedWebhookGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, perform standard signature verification
    const isSignatureValid = await super.canActivate(context);
    if (!isSignatureValid) {
      return false;
    }

    // Add custom logic
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const headers = request.headers;

    // Check if webhook is from allowed IP addresses
    const clientIp = request.ip;
    const allowedIps = ['192.168.1.1', '10.0.0.1'];
    if (!allowedIps.includes(clientIp)) {
      throw new AppError('Webhook from unauthorized IP', ErrorCodes.FORBIDDEN);
    }

    // Check if webhook is not too old
    const webhookTimestamp = headers['webhook-timestamp'];
    const currentTime = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    if (currentTime - webhookTimestamp > maxAge) {
      throw new AppError('Webhook too old', ErrorCodes.BAD_REQUEST);
    }

    return true;
  }
}

// Usage
@Controller('webhooks')
@UseGuards(CustomWebhookGuard)
export class CustomWebhookController {
  @Post('custom')
  async handleCustomWebhook(@Body() data: any, @Headers() headers: any) {
    return this.customService.processWebhook(data);
  }
}
```

### Different Webhook Providers
```typescript
// Handle different webhook providers with specific validation
import { SignedWebhookGuard } from '@app/nest/guards/signed-webhook';

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

  @Post('clerk/organization')
  @UseGuards(SignedWebhookGuard)
  async handleClerkOrganization(@Body() data: any, @Headers() headers: any) {
    return this.authService.processClerkOrganization(data);
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
```typescript
// Handle webhook signature verification errors
import { SignedWebhookGuard } from '@app/nest/guards/signed-webhook';
import { AppError, ErrorCodes } from '@app/nest/errors';

@Controller('webhooks')
export class WebhookController {
  @Post('stripe')
  @UseGuards(SignedWebhookGuard)
  async handleStripeWebhook(@Body() data: any, @Headers() headers: any) {
    try {
      return await this.paymentService.processStripeWebhook(data);
    } catch (error) {
      // Log webhook processing errors
      console.error('Webhook processing failed:', error);
      
      // Return appropriate error response
      throw new AppError('Webhook processing failed', ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
```

## Key Benefits

- **Security**: Ensures webhook requests come from authorized sources
- **Verification**: Validates webhook signatures to prevent tampering
- **Flexibility**: Supports multiple webhook providers and signature methods
- **Reliability**: Prevents unauthorized webhook processing

## Dependencies

- NestJS framework
- Crypto for signature verification
- TypeScript for type definitions 