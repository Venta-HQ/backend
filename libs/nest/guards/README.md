# Authentication Guards

This directory contains NestJS guards for handling authentication and authorization across services.

## Available Guards

### AuthGuard

General authentication guard for protecting routes and endpoints.

**Usage:**

```typescript
import { AuthGuard } from '@libs/nest/guards';

@Controller('protected')
@UseGuards(AuthGuard)
export class ProtectedController {
	@Get()
	getProtectedData() {
		return 'This is protected data';
	}
}
```

### SignedWebhookGuard

Verifies webhook signatures to ensure requests are coming from trusted sources.

**Usage:**

```typescript
import { SignedWebhookGuard } from '@libs/nest/guards';

@Controller('webhooks')
export class WebhookController {
	@Post('clerk')
	@UseGuards(SignedWebhookGuard)
	handleClerkWebhook(@Body() payload: any) {
		// Process webhook payload
	}
}
```

## Configuration

Guards may require specific environment variables or configuration depending on the authentication provider being used. Refer to the individual guard documentation for specific requirements.
