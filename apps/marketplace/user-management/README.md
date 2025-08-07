# User Management Service

## Purpose

The User Management service manages all user-related operations in the Venta backend system. It handles user authentication, profile management, subscription handling, and user-vendor relationships. This service serves as the central authority for user data and authentication state, providing gRPC endpoints for other services to consume user information and managing webhook integrations with external authentication and billing providers.

## Overview

This microservice provides:
- User account creation and management through Clerk webhook integration
- Authentication state management and user session handling
- User profile and preferences management with data validation
- Subscription and billing integration with RevenueCat webhooks
- User-vendor relationship management and permissions
- User data validation, sanitization, and compliance
- Webhook processing for external service events (Clerk, RevenueCat)
- Event publishing for user-related changes
- DDD-aligned domain services with unified error handling

## Key Responsibilities

- **User Management**: Handles user registration, updates, and deletion through Clerk webhooks
- **Authentication**: Integrates with Clerk for authentication and session management
- **Profile Management**: Manages user profiles, preferences, and settings with validation
- **Subscription Handling**: Processes subscription events and billing through RevenueCat
- **Vendor Relationships**: Manages connections between users and vendors with permissions
- **Data Validation**: Ensures user data integrity and compliance with business rules
- **Event Publishing**: Publishes user-related events for other services to consume
- **Webhook Processing**: Handles Clerk and RevenueCat webhook events
- **Domain Logic**: Implements business logic with proper error handling and logging

## Architecture

The service follows a domain-driven design approach, focusing specifically on user-related business logic. It exposes gRPC endpoints for other services to consume and publishes events for asynchronous communication with the rest of the system.

### Service Structure

```
User Management Service
├── Core Module
│   ├── User Service - User registration and profile management
│   └── User Controller - gRPC endpoints for user operations
├── Authentication Module
│   ├── Auth Service - Clerk integration and user management
│   └── Auth Controller - Clerk webhook processing
├── Subscriptions Module
│   ├── Subscription Service - RevenueCat integration and billing
│   └── Subscription Controller - RevenueCat webhook processing
├── Vendors Module
│   ├── Vendor Service - User-vendor relationship logic
│   └── Vendor Controller - User-vendor relationship management
├── Location Module
│   └── User Location Events Controller - Location service event handling
└── Module Configuration
    └── BootstrapModule - Standardized service bootstrapping with DDD domain
```

### DDD Domain

This service belongs to the **Marketplace** domain and is configured with `domain: 'marketplace'` in its bootstrap configuration.

## Usage

### Starting the Service

```bash
# Development mode
pnpm run start:dev user-management

# Production mode
pnpm run start:prod user-management

# With Docker
docker-compose up user-management
```

### Environment Configuration

```env
# Service Configuration
USER_SERVICE_ADDRESS=localhost:5000
USER_HEALTH_PORT=5010

# DDD Domain (automatically set by bootstrap)
DOMAIN=marketplace

# External Services
CLERK_SECRET_KEY=your-clerk-secret
CLERK_WEBHOOK_SECRET=your-clerk-webhook-secret
REVENUECAT_WEBHOOK_SECRET=your-revenuecat-webhook-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/venta

# Redis
REDIS_PASSWORD=your-redis-password

# NATS
NATS_URL=nats://localhost:4222
```

### Service Patterns

The service follows these patterns:

- **BootstrapModule**: Uses the standardized BootstrapModule with DDD domain configuration
- **gRPC Controllers**: Exposes gRPC endpoints for inter-service communication
- **Webhook Processing**: Handles external webhook events from Clerk and RevenueCat
- **Event Publishing**: Publishes events to NATS for other services to consume
- **Database Operations**: Uses PrismaService for database access via `prisma.db`
- **Unified Error Handling**: Uses `AppError` with automatic domain context
- **Domain Services**: Business logic with proper logging and error handling

### Error Handling

The service uses the unified error handling system:

```typescript
import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';

@Injectable()
export class UserService {
  async registerUser(registrationData: UserRegistrationData): Promise<UserProfile> {
    try {
      const user = await this.prisma.db.user.create({
        data: { clerkId: registrationData.clerkId },
      });
      return user;
    } catch (error) {
      throw new AppError(
        ErrorType.INTERNAL,
        ErrorCodes.DATABASE_ERROR,
        'Failed to register user',
        {
          clerkId: registrationData.clerkId,
          operation: 'register_user',
        }
      );
    }
  }
}
```

### Integration Points

- **Clerk Integration**: Processes user creation, updates, and deletion webhooks
- **RevenueCat Integration**: Handles subscription events and billing webhooks
- **Vendor Service**: Manages user-vendor relationships and permissions
- **Event System**: Publishes user-related events for other services
- **Database**: Stores user data, profiles, and relationships
- **Location Services**: Handles user location updates via events

## Dependencies

- **BootstrapModule** for standardized service configuration with DDD domain
- **PrismaService** for database operations
- **EventService** for publishing events to NATS
- **NatsQueueModule** for event subscription and processing
- **Clerk** for authentication and user management
- **RevenueCat** for subscription management and billing
- **Database** for user data persistence
- **Unified Error Handling** with automatic domain context
