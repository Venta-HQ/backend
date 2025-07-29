# Guards

This directory contains NestJS guards for authentication and authorization.

## Available Guards

- **[AuthGuard](./auth/README.md)** - JWT-based authentication using Clerk with Redis caching
- **[SignedWebhookGuard](./signed-webhook/README.md)** - Webhook signature verification using Svix

## Usage

```typescript
import { AuthGuard, SignedWebhookGuard } from '@app/nest/guards';

// Use AuthGuard for protected routes
@UseGuards(AuthGuard)

// Use SignedWebhookGuard for webhook endpoints
@UseGuards(SignedWebhookGuard(process.env.WEBHOOK_SECRET))
```
