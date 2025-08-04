# Clerk Module

## Purpose

The Clerk module provides authentication and user management integration for the Venta backend system. It includes Clerk client integration, user verification, and session management capabilities.

## What It Contains

- **Clerk Service**: Main authentication service with Clerk client integration
- **User Verification**: JWT token verification and user validation
- **Session Management**: User session handling and management
- **Webhook Handling**: Clerk webhook processing and user synchronization

## Usage

This module is imported by services that need authentication and user management capabilities.

### For Services
```typescript
// Import the Clerk module in your service module
import { ClerkModule } from '@app/nest/modules/clerk';

@Module({
  imports: [ClerkModule],
  // ... other module configuration
})
export class MyServiceModule {}
```

### For Authentication
```typescript
// Inject the Clerk service in your service
import { ClerkService } from '@app/nest/modules/clerk';

@Injectable()
export class MyService {
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

### For Webhook Handling
```typescript
// Handle Clerk webhooks in your controller
@Controller('webhooks/clerk')
export class ClerkWebhooksController {
  constructor(private readonly clerkService: ClerkService) {}

  @Post()
  async handleWebhook(@Body() webhookData: any) {
    return this.clerkService.processWebhook(webhookData);
  }
}
```

## Key Benefits

- **Authentication**: Secure user authentication and verification
- **User Management**: Centralized user data management
- **Session Handling**: Reliable session management
- **Webhook Integration**: Real-time user data synchronization

## Dependencies

- Clerk authentication service
- NestJS framework
- JWT for token handling 