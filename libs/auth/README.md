# Auth Library

This library provides authentication and authorization utilities for the Venta backend services.

## Overview

The auth library handles user authentication, authorization, and webhook verification for the application. It integrates with Clerk for user management and provides guards and services for protecting routes and validating webhook signatures.

## Features

- **Authentication Guards**: Protect routes by verifying user authentication via Clerk tokens
- **Webhook Verification**: Validate signed webhooks from external services using Svix
- **Clerk Integration**: Token verification and user session management
- **Redis Caching**: Efficient user ID caching to reduce database queries

## Usage

### Authentication Guard

Protect routes by applying the authentication guard to controllers or individual endpoints. The guard verifies Clerk session tokens and caches user IDs in Redis.

```typescript
import { AuthGuard } from '@app/auth';
import { Controller, Get, UseGuards } from '@nestjs/common';

@Controller('protected')
@UseGuards(AuthGuard)
export class ProtectedController {
	@Get()
	getProtectedData() {
		return { message: 'This is protected data' };
	}
}
```

The guard automatically:

- Extracts the Bearer token from the Authorization header
- Verifies the token using Clerk
- Caches the internal user ID in Redis for 1 hour
- Attaches the user ID to the request object

### Webhook Verification

Verify webhook signatures from external services like Clerk to ensure requests are legitimate.

```typescript
import { SignedWebhookGuard } from '@app/auth';
import { Controller, Post, UseGuards } from '@nestjs/common';

@Controller('webhooks')
export class WebhookController {
	@Post('clerk')
	@UseGuards(SignedWebhookGuard(process.env.CLERK_WEBHOOK_SECRET))
	handleClerkWebhook(@Body() event: any) {
		// Process verified webhook
		return { status: 'success' };
	}
}
```

The guard verifies the webhook signature using Svix and the provided secret.

### Token Verification

Use the Clerk service to verify session tokens and extract user information.

```typescript
import { ClerkService } from '@app/auth';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
	constructor(private readonly clerkService: ClerkService) {}

	async verifyUserToken(token: string) {
		try {
			const tokenContents = await this.clerkService.verifyToken(token);
			return tokenContents;
		} catch (error) {
			throw new Error('Invalid or expired token');
		}
	}
}
```

### Module Registration

Register the Clerk module in your application to enable authentication services.

```typescript
import { ClerkModule } from '@app/auth';
import { Module } from '@nestjs/common';

@Module({
	imports: [ClerkModule.register()],
	// ...
})
export class AppModule {}
```

## Dependencies

- Clerk SDK for token verification
- Svix for webhook signature verification
- Redis for user ID caching
- NestJS for framework integration
- Prisma for database access

## Environment Variables

- `CLERK_SECRET_KEY`: Clerk secret key for token verification
- `CLERK_WEBHOOK_SECRET`: Secret for webhook signature verification
