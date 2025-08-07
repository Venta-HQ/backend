# Venta Backend

A modern, scalable backend system built with NestJS, following Domain-Driven Design (DDD) principles and microservices architecture.

## Overview

Venta Backend is a comprehensive platform that provides vendor management, location services, user authentication, and real-time communication capabilities. The system is built with a focus on business alignment, team scalability, and long-term maintainability.

## Architecture

### Domain-Driven Design

The system is organized around business domains, with clear boundaries and rich business context:

```
apps/
├── marketplace/              # Business marketplace operations
│   ├── user-management/     # User accounts and profiles
│   ├── vendor-management/   # Vendor profiles and operations
│   └── search-discovery/    # Search indexing and discovery
├── location-services/       # Location and geospatial services
│   ├── geolocation/        # Location tracking and storage
│   └── real-time/          # Live location updates (WebSocket)
└── communication/          # External integrations
    └── webhooks/           # Webhook handling (Clerk, RevenueCat)
```

### Key Features

- **Domain Events**: Rich business events with automatic context extraction
- **Type Safety**: Compile-time validation of all operations
- **Structured Logging**: Business context in all logs for observability
- **Real-time Communication**: WebSocket support for live updates
- **Geospatial Services**: Efficient location tracking and proximity queries
- **Event-Driven Architecture**: NATS-based asynchronous communication

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Docker and Docker Compose
- PostgreSQL
- Redis
- NATS

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd venta-backend

# Install dependencies
pnpm install

# Start required services
docker-compose up -d postgres redis nats loki

# Run database migrations
pnpm prisma:migrate

# Start development servers
pnpm dev
```

### Environment Configuration

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/venta"

# Redis
REDIS_URL="redis://localhost:6379"

# NATS
NATS_URL="nats://localhost:4222"

# External Services
CLERK_SECRET_KEY="sk_test_..."
ALGOLIA_APP_ID="your-app-id"
ALGOLIA_API_KEY="your-api-key"

# Monitoring
LOKI_URL="http://localhost:3100"
LOKI_USERNAME="admin"
LOKI_PASSWORD="password"
```

## Services

### Marketplace Domain

#### User Management
- User authentication and profile management
- Integration with Clerk authentication
- User-vendor relationship management

#### Vendor Management
- Vendor onboarding and profile management
- Business validation and rules enforcement
- Vendor lifecycle management

#### Search Discovery
- Algolia integration for vendor search
- Real-time search indexing
- Location-based vendor discovery

### Location Services Domain

#### Geolocation
- Real-time location tracking for vendors and users
- Geospatial queries with Redis optimization
- Location validation and processing

#### Real-time Services
- WebSocket connections for live updates
- Real-time location broadcasting
- Connection management and rate limiting

### Communication Domain

#### Webhooks
- Clerk webhook handling for user events
- RevenueCat webhook processing for subscriptions
- External service integration

## Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all services in development
pnpm dev:vendor-management  # Start vendor management service
pnpm dev:location-services  # Start location services
pnpm dev:user-management    # Start user management service

# Building
pnpm build                  # Build all applications and libraries
pnpm build:apps             # Build only applications
pnpm build:libs             # Build only libraries

# Testing
pnpm test                   # Run all tests
pnpm test:cov               # Run tests with coverage
pnpm test:e2e               # Run end-to-end tests

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Run database migrations
pnpm prisma:studio          # Open Prisma Studio

# Linting and Formatting
pnpm lint                   # Run ESLint
pnpm lint:fix               # Fix ESLint issues
pnpm format                 # Format code with Prettier
```

### Project Structure

```
venta-backend/
├── apps/                   # Microservices
│   ├── marketplace/       # Business marketplace services
│   ├── location-services/ # Location and geospatial services
│   └── communication/     # External integrations
├── libs/                  # Shared libraries
│   ├── eventtypes/        # Event schema definitions
│   ├── nest/             # NestJS utilities and modules
│   ├── apitypes/         # API type definitions
│   └── utils/            # Utility functions
├── docs/                  # Documentation
├── prisma/               # Database schema and migrations
├── docker/               # Docker configuration
└── test/                 # Test utilities and setup
```

## Domain Events

The system uses domain events for asynchronous communication between services:

### Event Naming Convention

Events follow the pattern: `domain.subdomain_action`

```typescript
// Examples
'marketplace.vendor_onboarded'     // New vendor registration
'location.vendor_location_updated' // Vendor location changes
'marketplace.user_registered'      // New user registration
```

### Event Structure

```typescript
{
  context: {
    vendorId: "vendor-123",
    ownerId: "user-456"
  },
  meta: {
    eventId: "evt-789",
    source: "vendor-management",
    timestamp: "2024-12-01T10:00:00Z",
    version: "1.0",
    correlationId: "req-abc",
    domain: "marketplace",
    subdomain: "vendor"
  },
  data: {
    // Event-specific data
  }
}
```

## API Documentation

### gRPC Services

The system exposes gRPC endpoints for inter-service communication:

- **Vendor Management**: `localhost:5000`
- **Location Services**: `localhost:5001`
- **User Management**: `localhost:5002`

### Health Checks

Each service provides health check endpoints:

```bash
# Vendor Management
curl http://localhost:3001/health

# Location Services
curl http://localhost:3002/health

# User Management
curl http://localhost:3003/health
```

## Monitoring

### Logging

The system uses structured logging with Loki integration:

- **Centralized Logging**: All logs sent to Loki
- **Structured Data**: Business context in all log entries
- **Request Correlation**: Automatic request ID tracking

### Metrics

Prometheus metrics are collected for:

- Service health and performance
- Event processing rates
- Database operation latency
- External service integration status

### Dashboards

Grafana dashboards are available for:

- Service overview and health
- Request flow visualization
- Error rate monitoring
- Performance metrics

## Testing

### Unit Tests

```bash
# Run unit tests for all services
pnpm test

# Run tests for specific service
pnpm test:vendor-management
pnpm test:location-services
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Run with database
pnpm test:integration:db
```

### End-to-End Tests

```bash
# Run E2E tests
pnpm test:e2e
```

## Deployment

### Docker

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Kubernetes

Kubernetes manifests are provided for production deployment:

```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

## Contributing

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Follow DDD principles and coding standards
3. **Add Tests**: Include unit and integration tests
4. **Update Documentation**: Update relevant README files
5. **Submit PR**: Create pull request with clear description

### Coding Standards

- Follow DDD principles and domain boundaries
- Use TypeScript for type safety
- Include structured logging with business context
- Write comprehensive tests
- Follow established naming conventions

### DDD Guidelines

- **Domain Events**: Use business terminology in event names
- **Service Boundaries**: Keep services focused on business domains
- **Context Extraction**: Include relevant business context in events
- **Type Safety**: Use compile-time validation for all operations

## Documentation

### Architecture Guides

- [DDD Migration Guide](docs/ddd-migration-guide.md) - Complete DDD implementation overview
- [Event Pattern Enforcement](docs/event-pattern-enforcement.md) - Event validation patterns
- [Error Handling Guide](docs/error-handling-guide.md) - Unified error handling patterns
- [Logging Standards](docs/logging-standards.md) - Structured logging patterns

### Service Documentation

- [Vendor Management](apps/marketplace/vendor-management/README.md)
- [Location Services](apps/location-services/geolocation/README.md)
- [User Management](apps/marketplace/user-management/README.md)

### Library Documentation

- [EventTypes Library](libs/eventtypes/README.md)
- [NestJS Library](libs/nest/README.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Status**: ✅ **Production Ready**  
**Last Updated**: December 2024  
**Version**: 1.0.0
