# User Service

The User service handles user management, authentication integration, and subscription processing for the Venta backend.

## Overview

The User service is a NestJS gRPC microservice that:
- Manages user data and profiles
- Integrates with Clerk for user authentication
- Processes subscription events from RevenueCat
- Handles user-vendor relationships
- Provides user data to other services

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Gateway       │    │   Clerk         │    │   RevenueCat    │
│   Service       │    │   (Auth)        │    │   (Billing)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      User Service        │
                    │      (gRPC Server)       │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      Database            │
                    │   (PostgreSQL + Redis)   │
                    └───────────────────────────┘
```

## Features

### 👤 User Management
- **User CRUD Operations**: Create, read, update, delete user profiles
- **Profile Management**: Handle user profile data and preferences
- **User-Vendor Relationships**: Manage associations between users and vendors

### 🔐 Authentication Integration
- **Clerk Integration**: Process Clerk user events (created, deleted, updated)
- **User Synchronization**: Keep internal user data in sync with Clerk
- **Session Management**: Handle user session data and caching

### 💳 Subscription Processing
- **RevenueCat Integration**: Process subscription events and updates
- **Subscription Management**: Track user subscription status and history
- **Billing Integration**: Handle subscription-related data

### 🔄 Event Publishing
- **Event-Driven Architecture**: Publish user events to other services
- **NATS Integration**: Use NATS for event communication
- **Event Types**: User created, updated, deleted, subscription changes

## gRPC API

### Service Definition
```protobuf
service UserService {
  // Clerk Integration
  rpc HandleClerkUserCreated(ClerkUserData) returns (ClerkWebhookResponse);
  rpc HandleClerkUserDeleted(ClerkUserData) returns (ClerkWebhookResponse);
  
  // Subscription Management
  rpc HandleSubscriptionCreated(RevenueCatSubscriptionData) returns (SubscriptionCreatedResponse);
  
  // User Data
  rpc GetUserVendors(UserVendorData) returns (UserVendorsResponse);
}
```

### Endpoints

#### Clerk Integration
```
HandleClerkUserCreated(ClerkUserData) → ClerkWebhookResponse
- Creates internal user record when Clerk user is created
- Validates user data and stores in database
- Publishes user.created event

HandleClerkUserDeleted(ClerkUserData) → ClerkWebhookResponse
- Removes internal user record when Clerk user is deleted
- Cleans up associated data
- Publishes user.deleted event
```

#### Subscription Management
```
HandleSubscriptionCreated(RevenueCatSubscriptionData) → SubscriptionCreatedResponse
- Processes new subscription events from RevenueCat
- Updates user subscription status
- Publishes subscription.created event
```

#### User Data
```
GetUserVendors(UserVendorData) → UserVendorsResponse
- Retrieves all vendors associated with a user
- Returns vendor list with relationship data
```

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis for caching
- NATS for event communication
- Clerk and RevenueCat accounts

### Environment Variables
```bash
# Service Configuration
USER_SERVICE_PORT=5001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/venta

# Redis
REDIS_URL=redis://localhost:6379

# NATS
NATS_URL=nats://localhost:4222

# External Services
CLERK_SECRET_KEY=your_clerk_secret_key
REVENUECAT_WEBHOOK_SECRET=your_revenuecat_webhook_secret
```

### Development
```bash
# Install dependencies
pnpm install

# Start development server
nx serve user

# Run tests
nx test user

# Lint code
nx lint user

# Type check
nx typecheck user
```

### Production Build
```bash
# Build for production
nx build user

# Start production server
nx serve user --configuration=production
```

### Docker Deployment
```bash
# Build Docker image
docker build -t venta-user .

# Run container
docker run -p 5001:5001 venta-user
```

## Development

### Project Structure
```
apps/user/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── user.module.ts             # Root module
│   ├── clerk/                     # Clerk integration
│   │   ├── clerk.controller.ts    # gRPC controller
│   │   └── clerk.service.ts       # Business logic
│   ├── subscription/              # Subscription management
│   │   ├── subscription.controller.ts
│   │   └── subscription.service.ts
│   └── vendor/                    # User-vendor relationships
│       ├── vendor.controller.ts
│       └── vendor.service.ts
├── project.json                   # Nx configuration
├── tsconfig.json                  # TypeScript configuration
├── webpack.config.js              # Build configuration
└── Dockerfile                     # Container configuration
```

### Adding New gRPC Endpoints

1. **Update Proto Definition**:
```protobuf
// In libs/proto/src/definitions/user.proto
service UserService {
  // ... existing endpoints
  rpc NewEndpoint(NewRequest) returns (NewResponse);
}
```

2. **Create Controller Method**:
```typescript
@Controller()
export class UserController {
  @Post('newEndpoint')
  async newEndpoint(@Body() data: NewRequest): Promise<NewResponse> {
    return await this.userService.newEndpoint(data);
  }
}
```

3. **Implement Service Logic**:
```typescript
@Injectable()
export class UserService {
  async newEndpoint(data: NewRequest): Promise<NewResponse> {
    // Business logic implementation
    return { success: true };
  }
}
```

## Testing

### Unit Tests
```bash
nx test user
```

### Integration Tests
```bash
# Start test services
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
nx test user --testPathPattern=integration
```

### gRPC Testing
```bash
# Using grpcurl
grpcurl -plaintext -d '{"id": "user123"}' localhost:5001 UserService/GetUserVendors

# Using BloomRPC or similar gRPC client
# Import the proto files and test endpoints
```

## Event Publishing

### Event Types
The service publishes the following events via NATS:

```typescript
// User Events
'user.created'     // When a new user is created
'user.updated'     // When user data is updated
'user.deleted'     // When a user is deleted

// Subscription Events
'subscription.created'  // When a new subscription is created
'subscription.updated'  // When subscription is updated
'subscription.cancelled' // When subscription is cancelled
```

### Event Structure
```typescript
interface UserEvent {
  type: string;
  data: {
    userId: string;
    email?: string;
    // ... other user data
  };
  timestamp: string;
  messageId: string;
}
```

## Database Schema

### User Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Integration Table
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Monitoring & Logging

### Logging
- Structured logging with Pino
- Request/response logging for gRPC calls
- Error tracking and monitoring

### Health Checks
```
GET /health          # Service health status
GET /metrics         # Prometheus metrics
```

### Error Handling
- Centralized error handling
- Structured error responses
- Error logging and alerting

## Dependencies

### Core Libraries
- **NestJS**: Framework for building scalable server-side applications
- **gRPC**: High-performance RPC framework
- **Prisma**: Database ORM and query builder
- **Redis**: Caching and session storage
- **NATS**: Event streaming and messaging

### External Services
- **Clerk**: User authentication and management
- **RevenueCat**: Subscription and billing management

## Performance Considerations

### Caching Strategy
- User data cached in Redis
- Cache invalidation on user updates
- TTL-based cache expiration

### Database Optimization
- Indexed queries on frequently accessed fields
- Connection pooling
- Query optimization

### Event Processing
- Asynchronous event publishing
- Event batching for high throughput
- Dead letter queue for failed events

## Security

### Data Protection
- Sensitive data encryption
- Input validation and sanitization
- SQL injection prevention

### Access Control
- gRPC authentication
- Rate limiting
- Request validation

## Troubleshooting

### Common Issues

**gRPC Connection Issues**:
```bash
# Check service status
nx serve user

# Check port availability
lsof -i :5001
```

**Database Connection Issues**:
```bash
# Check database status
docker ps | grep postgres

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Event Publishing Issues**:
```bash
# Check NATS connection
nats-sub "user.*"

# Check NATS server status
docker ps | grep nats
```

For more detailed troubleshooting, see the main project documentation. 