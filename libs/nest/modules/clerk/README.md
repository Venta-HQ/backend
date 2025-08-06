# Clerk Module

## Purpose

The Clerk module provides authentication and user management integration for the Venta backend system. It includes Clerk client integration, user verification, session management, and webhook processing capabilities for secure authentication and user data synchronization.

## Overview

This module provides:

- Clerk client integration and configuration
- JWT token verification and user validation
- User session management and caching
- Webhook processing for user synchronization
- User data management and updates
- Authentication state management

## Usage

### Module Registration

Register the Clerk module in your service:

```typescript
import { ClerkModule } from '@app/nest/modules/clerk';

@Module({
	imports: [ClerkModule.register()],
	// ... other module configuration
})
export class YourServiceModule {}
```

### Service Injection

Inject ClerkService for authentication operations:

```typescript
import { ClerkService } from '@app/nest/modules/clerk';

@Injectable()
export class YourService {
	constructor(private readonly clerkService: ClerkService) {}

	async verifyUser(token: string) {
		try {
			const user = await this.clerkService.verifyToken(token);
			return user;
		} catch (error) {
			throw new AppError('Invalid token', ErrorCodes.UNAUTHORIZED);
		}
	}

	async getUserById(userId: string) {
		return this.clerkService.getUser(userId);
	}

	async updateUser(userId: string, userData: any) {
		return this.clerkService.updateUser(userId, userData);
	}
}
```

### Authentication Operations

Perform authentication and user verification:

```typescript
// Verify JWT token
async verifyToken(token: string) {
  const user = await this.clerkService.verifyToken(token);
  return user;
}

// Get user by ID
async getUserById(userId: string) {
  const user = await this.clerkService.getUser(userId);
  return user;
}

// Update user data
async updateUserProfile(userId: string, profileData: any) {
  const updatedUser = await this.clerkService.updateUser(userId, profileData);
  return updatedUser;
}

// Delete user
async deleteUser(userId: string) {
  await this.clerkService.deleteUser(userId);
}
```

### Webhook Processing

Handle Clerk webhooks for user synchronization:

```typescript
@Controller('webhooks/clerk')
export class ClerkWebhooksController {
	constructor(private readonly clerkService: ClerkService) {}

	@Post()
	async handleWebhook(@Body() webhookData: any) {
		return this.clerkService.processWebhook(webhookData);
	}
}
```

### Session Management

Manage user sessions and authentication state:

```typescript
// Create user session
async createSession(userId: string, sessionData: any) {
  const session = await this.clerkService.createSession(userId, sessionData);
  return session;
}

// Validate session
async validateSession(sessionId: string) {
  const session = await this.clerkService.validateSession(sessionId);
  return session;
}

// Revoke session
async revokeSession(sessionId: string) {
  await this.clerkService.revokeSession(sessionId);
}
```

### Environment Configuration

Configure Clerk with environment variables:

```env
# Clerk Configuration
CLERK_SECRET_KEY=your-clerk-secret-key
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret

# Session Configuration
CLERK_SESSION_DURATION=86400
CLERK_JWT_TTL=3600
```

## Key Benefits

- **Authentication**: Secure user authentication and verification
- **User Management**: Centralized user data management
- **Session Handling**: Reliable session management
- **Webhook Integration**: Real-time user data synchronization
- **Security**: JWT-based secure authentication
- **Scalability**: Handles high-volume authentication requests
- **Integration**: Seamless Clerk service integration

## Dependencies

- **Clerk** for authentication service and user management
- **NestJS** for module framework and dependency injection
- **JWT** for token handling and verification
