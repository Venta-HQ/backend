# Auth Library

This library provides authentication and authorization utilities for the Venta backend services.

## Overview

The auth library handles user authentication, authorization, and webhook verification for the application. It integrates with Clerk for user management and provides guards and services for protecting routes and validating webhook signatures.

## Features

- **Authentication Guards**: Protect routes by verifying user authentication
- **Webhook Verification**: Validate signed webhooks from external services
- **Clerk Integration**: User management and authentication services
- **Authorization**: Role-based access control and user verification

## Usage

### Authentication Guard

Protect routes by applying the authentication guard to controllers or individual endpoints.

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

### User Management

Access user information and manage authentication state through the Clerk service.

```typescript
import { ClerkService } from '@app/auth';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
	constructor(private readonly clerkService: ClerkService) {}

	async getUserInfo(userId: string) {
		return await this.clerkService.getUser(userId);
	}
}
```

## Dependencies

- Clerk SDK for user management
- NestJS for framework integration
- JWT for token handling
