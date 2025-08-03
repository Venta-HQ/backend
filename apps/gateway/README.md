# Gateway Service

The Gateway service acts as the main HTTP API entry point for the Venta backend, providing a unified interface for client applications to interact with all backend services.

## Overview

The Gateway service is a NestJS application that:
- Provides HTTP API endpoints for all major functionality
- Routes requests to appropriate microservices via gRPC
- Handles authentication and authorization
- Processes webhooks from external services (Clerk, RevenueCat)
- Manages file uploads
- Provides a unified API surface for frontend applications

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mobile App    │    │   Third Party   │
│   Application   │    │                 │    │   Services      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Gateway Service      │
                    │     (HTTP API Layer)      │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      gRPC Routing        │
                    │   to Microservices       │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐    ┌───────────▼──────────┐    ┌────────▼────────┐
│  User Service  │    │  Vendor Service      │    │ Location Service│
│  (gRPC)        │    │  (gRPC)              │    │ (gRPC)          │
└────────────────┘    └──────────────────────┘    └─────────────────┘
```

## Features

### 🔐 Authentication & Authorization
- **Clerk Integration**: User authentication via Clerk tokens
- **Auth Guards**: Route protection and user verification
- **Webhook Verification**: Secure webhook processing

### 📡 API Endpoints
- **User Management**: User CRUD operations and profile management
- **Vendor Management**: Vendor creation, updates, and queries
- **File Uploads**: Secure file upload and storage
- **Webhooks**: External service integration (Clerk, RevenueCat)

### 🔄 Service Communication
- **gRPC Clients**: Type-safe communication with microservices
- **Request Routing**: Intelligent routing to appropriate services
- **Error Handling**: Centralized error management and responses

## API Endpoints

### Authentication
All protected endpoints require a valid Clerk session token in the Authorization header:
```
Authorization: Bearer <clerk-session-token>
```

### User Endpoints
```
GET    /user/profile          # Get current user profile
PUT    /user/profile          # Update user profile
GET    /user/vendors          # Get user's vendors
```

### Vendor Endpoints
```
GET    /vendor/:id            # Get vendor by ID
POST   /vendor                # Create new vendor
PUT    /vendor/:id            # Update vendor
DELETE /vendor/:id            # Delete vendor
```

### Upload Endpoints
```
POST   /upload/file           # Upload file
GET    /upload/file/:id       # Get file by ID
DELETE /upload/file/:id       # Delete file
```

### Webhook Endpoints
```
POST   /webhook/clerk         # Clerk user events
POST   /webhook/subscription  # RevenueCat subscription events
```

## Setup

### Prerequisites
- Node.js 18+
- Docker (for containerized deployment)
- Access to required services (Clerk, RevenueCat, etc.)

### Environment Variables
```bash
# Service Configuration
GATEWAY_SERVICE_PORT=5003
NODE_ENV=development

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/venta

# Redis
REDIS_URL=redis://localhost:6379

# External Services
REVENUECAT_WEBHOOK_SECRET=your_revenuecat_webhook_secret

# Microservice URLs
USER_SERVICE_URL=localhost:5001
VENDOR_SERVICE_URL=localhost:5002
LOCATION_SERVICE_URL=localhost:5004
```

### Development
```bash
# Install dependencies
pnpm install

# Start development server
nx serve gateway

# Run tests
nx test gateway

# Lint code
nx lint gateway

# Type check
nx typecheck gateway
```

### Production Build
```bash
# Build for production
nx build gateway

# Start production server
nx serve gateway --configuration=production
```

### Docker Deployment
```bash
# Build Docker image
docker build -t venta-gateway .

# Run container
docker run -p 5003:5003 venta-gateway
```

## Development

### Project Structure
```
apps/gateway/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── router.ts                  # Route configuration
│   ├── upload/                    # File upload functionality
│   │   ├── upload.controller.ts
│   │   └── upload.module.ts
│   ├── user/                      # User management
│   │   ├── user.controller.ts
│   │   └── user.module.ts
│   ├── vendor/                    # Vendor management
│   │   ├── vendor.controller.ts
│   │   └── vendor.module.ts
│   └── webhook/                   # Webhook processing
│       ├── clerk/
│       │   ├── clerk-webhooks.controller.ts
│       │   └── clerk-webhooks.module.ts
│       └── subscription/
│           ├── subscription-webhooks.controller.ts
│           └── subscription-webhooks.module.ts
├── project.json                   # Nx configuration
├── tsconfig.json                  # TypeScript configuration
├── webpack.config.js              # Build configuration
└── Dockerfile                     # Container configuration
```

### Adding New Endpoints

1. **Create Controller**:
```typescript
@Controller('new-feature')
export class NewFeatureController {
  constructor(
    @Inject(NEW_SERVICE_NAME) private client: GrpcInstance<NewServiceClient>
  ) {}

  @Get()
  async getData() {
    return await this.client.invoke('getData', {});
  }
}
```

2. **Add to Router**:
```typescript
// In router.ts
export const routes = [
  {
    path: 'new-feature',
    module: NewFeatureModule,
  },
];
```

3. **Update Module**:
```typescript
// In app.module.ts
imports: [
  // ... existing imports
  NewFeatureModule,
]
```

## Testing

### Unit Tests
```bash
nx test gateway
```

### Integration Tests
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
nx test gateway --testPathPattern=integration
```

### API Testing
```bash
# Using curl
curl -H "Authorization: Bearer <token>" http://localhost:5003/vendor/123

# Using Postman
# Import the provided Postman collection for API testing
```

## Monitoring & Logging

### Logging
The service uses structured logging with Pino:
- Request/response logging
- Error tracking
- Performance metrics

### Health Checks
```
GET /health          # Service health status
GET /metrics         # Prometheus metrics
```

### Error Handling
- Centralized error handling via `ErrorHandlingModule`
- Structured error responses
- Error logging and monitoring

## Dependencies

### Core Libraries
- **NestJS**: Framework for building scalable server-side applications
- **gRPC**: High-performance RPC framework for microservice communication
- **Prisma**: Database ORM and query builder
- **Redis**: Caching and session storage

### External Services
- **Clerk**: User authentication and management
- **RevenueCat**: Subscription and billing management
- **Algolia**: Search functionality

## Contributing

1. Follow the established code patterns and conventions
2. Add tests for new functionality
3. Update documentation for API changes
4. Ensure all linting and type checking passes

## Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
# Check what's using the port
lsof -i :5003

# Kill the process
kill -9 <PID>
```

**Database Connection Issues**:
```bash
# Check database status
docker ps | grep postgres

# Restart database
docker-compose restart postgres
```

**gRPC Connection Issues**:
```bash
# Check microservice status
nx serve user
nx serve vendor
nx serve location
```

For more detailed troubleshooting, see the main project documentation. 