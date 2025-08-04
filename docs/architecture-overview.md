# Architecture Overview

## System Architecture

The Venta Backend is built as a microservices-based system using NestJS, following modern architectural patterns for scalability, maintainability, and reliability.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Mobile Apps   │    │   Web Apps      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      API Gateway          │
                    │   (apps/gateway)          │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼────────┐    ┌───────────▼──────────┐    ┌────────▼────────┐
│  User Service  │    │  Vendor Service      │    │ Location Service│
│ (apps/user)    │    │ (apps/vendor)        │    │(apps/location)  │
└───────┬────────┘    └──────────┬───────────┘    └────────┬────────┘
        │                        │                         │
        └────────────────────────┼─────────────────────────┘
                                 │
                                         ┌─────────────▼─────────────┐
                     │    Algolia Sync           │
                     │  (apps/algolia-sync)      │
                     └───────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                WebSocket Gateway                            │
│           (apps/websocket-gateway)                         │
│                    Real-time connections                    │
└─────────────────────────────────────────────────────────────┘
```

## Service Architecture

### Core Services

#### 1. API Gateway (`apps/gateway`)
- **Purpose**: Main entry point for all client requests
- **Responsibilities**:
  - Request routing and load balancing
  - Authentication and authorization
  - Rate limiting and throttling
  - Request/response transformation
  - API versioning
- **Communication**: HTTP/REST APIs, gRPC client to other services
- **Port**: Configurable via `GATEWAY_SERVICE_PORT` environment variable

#### 2. User Service (`apps/user`)
- **Purpose**: User management and webhook handling
- **Responsibilities**:
  - Clerk webhook processing (user creation/deletion)
  - RevenueCat subscription webhook handling
  - User-vendor association management
  - User data synchronization
- **Communication**: gRPC server, HTTP webhooks (Clerk, RevenueCat)
- **Port**: Configurable via `USER_SERVICE_ADDRESS` environment variable (default: localhost:5000)

#### 3. Vendor Service (`apps/vendor`)
- **Purpose**: Vendor and business management
- **Responsibilities**:
  - Vendor profile management (CRUD operations)
  - Business information and settings
  - Vendor data synchronization
  - Vendor lookup and retrieval
- **Communication**: gRPC server
- **Port**: Configurable via `VENDOR_SERVICE_ADDRESS` environment variable (default: localhost:5005)

#### 4. Location Service (`apps/location`)
- **Purpose**: Real-time location tracking and geospatial operations
- **Responsibilities**:
  - Vendor location updates and management
  - Geospatial queries for vendor locations
  - Location-based vendor discovery
  - Location data synchronization
- **Communication**: gRPC server
- **Port**: Configurable via `LOCATION_SERVICE_ADDRESS` environment variable (default: localhost:5001)

#### 5. WebSocket Gateway (`apps/websocket-gateway`)
- **Purpose**: Real-time communication hub (separate from HTTP gateway)
- **Responsibilities**:
  - WebSocket connections management
  - Real-time location updates for users and vendors
  - Live notifications and events
  - Connection state management
- **Communication**: WebSocket server, gRPC client to other services
- **Port**: Configurable via `WEBSOCKET_GATEWAY_SERVICE_PORT` environment variable

#### 6. Algolia Sync (`apps/algolia-sync`)
- **Purpose**: Search index synchronization
- **Responsibilities**:
  - Data synchronization with Algolia
  - Search index optimization
  - Search analytics and monitoring
- **Communication**: HTTP client (Algolia API)
- **Port**: Configurable via `ALGOLIA_SYNC_SERVICE_PORT` environment variable

## Communication Patterns

### 1. Synchronous Communication
- **gRPC**: Used for inter-service communication
  - Type-safe and high-performance
  - Protocol Buffers for data serialization
  - Bidirectional streaming support
- **HTTP/REST**: Used for external API communication and webhooks
  - Standard RESTful endpoints
  - JSON payloads
  - Stateless communication
  - Webhook processing (Clerk, RevenueCat)

### 2. Asynchronous Communication
- **WebSocket**: Real-time bidirectional communication
  - Live updates and notifications
  - Connection state management
  - Event-driven architecture
- **HTTP Webhooks**: External service integration
  - Clerk user events (creation, deletion)
  - RevenueCat subscription events
  - Third-party service notifications

### 3. Event-Driven Architecture
- **WebSocket Events**: Real-time events for client applications
- **Webhook Events**: External service events (Clerk, RevenueCat)
- **Location Updates**: Real-time location data for vendors and users

## Data Architecture

### Database Strategy
- **Primary Database**: PostgreSQL
  - ACID compliance for transactional data
  - JSON support for flexible schemas
  - Geospatial extensions for location data
- **Caching Layer**: Redis
  - Session management
  - Rate limiting
  - Temporary data storage
- **Search Engine**: Algolia
  - Full-text search capabilities
  - Real-time indexing
  - Advanced search features

### Data Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Services  │───▶│ PostgreSQL  │───▶│   Algolia   │
└─────────────┘    └─────────────┘    └─────────────┘
        │                   │
        ▼                   ▼
┌─────────────┐    ┌─────────────┐
│    Redis    │    │    NATS     │
└─────────────┘    └─────────────┘
```

## Security Architecture

### Authentication & Authorization
- **Clerk**: Third-party authentication service
  - JWT token management
  - Multi-factor authentication
  - Social login integration
- **Guards**: NestJS guards for route protection
  - Authentication guards
  - Authorization guards
  - Rate limiting guards

### Data Protection
- **Encryption**: Data encryption at rest and in transit
- **Input Validation**: Schema validation using Zod
- **Rate Limiting**: Protection against abuse
- **CORS**: Cross-origin resource sharing configuration

## Monitoring & Observability

### Metrics & Monitoring
- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards
- **Health Checks**: Service health monitoring
- **Custom Metrics**: Business-specific metrics

### Logging & Tracing
- **Structured Logging**: JSON-formatted logs
- **Request Tracing**: Distributed tracing with request IDs
- **Error Tracking**: Centralized error handling
- **Performance Monitoring**: Response time tracking

## Scalability Considerations

### Horizontal Scaling
- **Stateless Services**: All services are stateless for easy scaling
- **Load Balancing**: Multiple instances can be deployed
- **Database Sharding**: PostgreSQL can be sharded if needed
- **Cache Distribution**: Redis cluster for high availability

### Performance Optimization
- **Connection Pooling**: Database connection management
- **Caching Strategy**: Multi-layer caching approach
- **Async Processing**: Non-blocking operations
- **CDN Integration**: Static asset delivery

## Deployment Architecture

### Containerization
- **Docker**: All services containerized
- **Docker Compose**: Local development environment
- **Multi-stage Builds**: Optimized production images

### Infrastructure
- **Kubernetes Ready**: Services designed for K8s deployment
- **Environment Configuration**: Environment-specific configs
- **Secrets Management**: Secure configuration handling
- **Health Checks**: Container health monitoring

## Development Workflow

### Code Organization
- **Monorepo Structure**: All services in single repository
- **Shared Libraries**: Common code in `libs/` directory
- **Type Safety**: TypeScript throughout the stack
- **Code Quality**: ESLint, Prettier, and testing

### Testing Strategy
- **Unit Tests**: Vitest for fast feedback
- **Integration Tests**: Service integration testing
- **E2E Tests**: Full system testing
- **Load Testing**: Performance validation

This architecture provides a solid foundation for building scalable, maintainable, and reliable microservices that can evolve with business needs. 