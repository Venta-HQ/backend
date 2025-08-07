# User Service

## Purpose

The User service manages all user-related operations in the Venta backend system. It handles user authentication, profile management, subscription handling, and user-vendor relationships. This service serves as the central authority for user data and authentication state, providing gRPC endpoints for other services to consume user information and managing webhook integrations with external authentication and billing providers.

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

## Key Responsibilities

- **User Management**: Handles user registration, updates, and deletion through Clerk webhooks
- **Authentication**: Integrates with Clerk for authentication and session management
- **Profile Management**: Manages user profiles, preferences, and settings with validation
- **Subscription Handling**: Processes subscription events and billing through RevenueCat
- **Vendor Relationships**: Manages connections between users and vendors with permissions
- **Data Validation**: Ensures user data integrity and compliance with business rules
- **Event Publishing**: Publishes user-related events for other services to consume
- **Webhook Processing**: Handles Clerk and RevenueCat webhook events

## Architecture

The service follows a domain-driven design approach, focusing specifically on user-related business logic. It exposes gRPC endpoints for other services to consume and publishes events for asynchronous communication with the rest of the system.

### Service Structure

```
User Service
├── Controllers (gRPC)
│   ├── Clerk Controller - Clerk webhook processing
│   ├── Subscription Controller - RevenueCat webhook processing
│   └── Vendor Controller - User-vendor relationship management
├── Services
│   ├── Clerk Service - Clerk integration and user management
│   ├── Subscription Service - RevenueCat integration and billing
│   └── Vendor Service - User-vendor relationship logic
└── Module Configuration
    └── BootstrapModule - Standardized service bootstrapping
```

## Usage

### Starting the Service

```bash
# Development mode
pnpm run start:dev user

# Production mode
pnpm run start:prod user

# With Docker
docker-compose up user
```

### Environment Configuration

```env
# Service Configuration
USER_SERVICE_ADDRESS=localhost:5000
USER_HEALTH_PORT=5010

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

- **BootstrapModule**: Uses the standardized BootstrapModule for service configuration
- **gRPC Controllers**: Exposes gRPC endpoints for inter-service communication
- **Webhook Processing**: Handles external webhook events from Clerk and RevenueCat
- **Event Publishing**: Publishes events to NATS for other services to consume
- **Database Operations**: Uses PrismaService for database access via `prisma.db`
- **Error Handling**: Uses standardized AppError patterns for consistent error responses

### Integration Points

- **Clerk Integration**: Processes user creation, updates, and deletion webhooks
- **RevenueCat Integration**: Handles subscription events and billing webhooks
- **Vendor Service**: Manages user-vendor relationships and permissions
- **Event System**: Publishes user-related events for other services
- **Database**: Stores user data, profiles, and relationships

## Dependencies

- **BootstrapModule** for standardized service configuration
- **PrismaService** for database operations
- **EventService** for publishing events to NATS
- **NatsQueueModule** for event subscription and processing
- **Clerk** for authentication and user management
- **RevenueCat** for subscription management and billing
- **Database** for user data persistence
