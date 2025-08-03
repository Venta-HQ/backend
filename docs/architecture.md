# Architecture Overview

## System Architecture

Venta Backend is built as a microservices architecture using NestJS, designed for real-time mobile app requirements with high scalability and maintainability.

### Service Architecture

```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐
│   Mobile App    │ ──────────────► │     Gateway     │
│                 │                 │   (Port 5002)   │
└─────────────────┘                 └─────────────────┘
                                              │
                                              │ gRPC
                                              ▼
┌─────────────────┐                 ┌─────────────────┐
│  WebSocket App  │ ◄────────────── │ WebSocket Gateway│
│                 │   Socket.IO     │   (Port 5004)   │
└─────────────────┘                 └─────────────────┘
                                              │
                                              │ gRPC
                                              ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Algolia Sync  │    │   User Service  │    │  Vendor Service │
│   (Port 5006)   │    │   (Port 5000)   │    │   (Port 5005)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Algolia     │    │   PostgreSQL    │    │      NATS       │
│   (Search)      │    │   (Database)    │    │   (Events)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Service Communication Patterns

### 1. HTTP Gateway Pattern

- **Gateway Service** (Port 5002): Single entry point for all HTTP requests
- **Authentication**: Clerk-based JWT validation
- **Routing**: Routes requests to appropriate gRPC services
- **Rate Limiting**: Built-in request throttling

### 2. gRPC Internal Communication

- **Service-to-Service**: All internal communication uses gRPC
- **Protocol Buffers**: Type-safe contracts between services
- **Performance**: Binary protocol for efficient communication
- **Load Balancing**: Built-in gRPC load balancing support

### 3. Event-Driven Architecture

- **NATS**: Real-time event messaging with persistence
- **Provider-Agnostic**: Generic `IEventsService` interface
- **Decoupled Services**: Services emit events, others consume
- **Fault Tolerance**: Failed events are stored and retried
- **Scalability**: Easy to add new event consumers
- **Subject-Based Routing**: NATS subjects for efficient filtering

## Technology Stack

### Core Framework

- **NestJS**: Enterprise-grade Node.js framework
- **TypeScript**: Type-safe development
- **gRPC**: High-performance RPC framework
- **Protocol Buffers**: Contract-first API design

### Data Layer

- **PostgreSQL**: Primary database
- **Prisma**: Type-safe database client
- **NATS**: Event messaging and persistence
- **Redis**: Caching (no longer used for events)
- **Algolia**: Search and discovery

### Authentication & External Services

- **Clerk**: User authentication and management
- **Cloudinary**: File upload and image processing
- **RevenueCat**: Subscription management

### Infrastructure

- **Docker**: Containerization
- **Docker Compose**: Local development
- **Loki + Grafana**: Logging and monitoring

## Event-Driven Architecture

### Event Flow

```
1. User Action (e.g., create vendor)
   ↓
2. Service Processing (vendor service)
   ↓
3. Event Emission (NATS with subject-based routing)
   ↓
4. Event Consumption (algolia-sync)
   ↓
5. External Update (Algolia search)
```

### Provider-Agnostic Design

The event system uses a generic interface that can be implemented by different providers:

```typescript
// Generic interface
interface IEventsService {
	publishEvent<T>(eventType: string, data: T): Promise<void>;
	subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;
	subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<any>;
	healthCheck(): Promise<{ status: string; connected: boolean }>;
}

// Current implementation: NATS
// Future: Could be Kafka, Redis, or any other provider
```

### Event Types

#### Vendor Events
- `vendor.created`: New vendor created
- `vendor.updated`: Vendor information updated
- `vendor.deleted`: Vendor removed
- `vendor.location.updated`: Vendor location updated

#### User Events
- `user.created`: New user created
- `user.deleted`: User deleted
- `user.integration.created`: User integration created
- `user.integration.deleted`: User integration deleted

#### WebSocket Events
- `websocket.user.connected`: User WebSocket connection established
- `websocket.user.disconnected`: User WebSocket connection closed
- `websocket.vendor.connected`: Vendor WebSocket connection established
- `websocket.vendor.disconnected`: Vendor WebSocket connection closed

### Benefits

- **Real-time Updates**: Immediate search index updates
- **Decoupling**: Services don't need to know about each other
- **Extensibility**: Easy to add new consumers (analytics, notifications)
- **Reliability**: Failed events are retried automatically
- **Provider Flexibility**: Easy migration between event providers
- **Persistence**: NATS provides message persistence and replay

## Scalability Considerations

### Horizontal Scaling

- **Stateless Services**: All services are stateless
- **Load Balancing**: gRPC supports client-side load balancing
- **Database**: PostgreSQL with connection pooling
- **Events**: NATS clustering for high availability

### Performance Optimization

- **Connection Pooling**: Database and NATS connections
- **Caching**: Redis for frequently accessed data
- **Compression**: gRPC compression enabled
- **Monitoring**: Comprehensive logging and metrics
- **Subject-Based Routing**: Efficient event filtering

## Security Architecture

### Authentication

- **JWT Tokens**: Clerk-managed authentication
- **Token Validation**: Gateway-level validation
- **User Context**: Passed through gRPC metadata

### Authorization

- **Resource Ownership**: Users can only access their own resources
- **Service-to-Service**: Internal service communication
- **API Rate Limiting**: Gateway-level protection

### Data Protection

- **Environment Variables**: Secure configuration management
- **Database Encryption**: PostgreSQL encryption at rest
- **HTTPS/WSS**: All external communication encrypted

## Monitoring & Observability

### Health Checks

- **Service Health**: `/health` endpoints on all services
- **Event System**: `/health/events` for event monitoring
- **Database**: Connection health monitoring
- **NATS**: Server health monitoring

### Logging

- **Structured Logging**: JSON format with correlation IDs
- **Centralized**: Loki aggregation
- **Visualization**: Grafana dashboards

### Metrics

- **Performance**: Response times, throughput
- **Errors**: Error rates and types
- **Business**: User actions, feature usage
- **Events**: Event throughput, failed events, processing latency

## Future Considerations

### Potential Improvements

- **Service Mesh**: Istio for advanced traffic management
- **Event Sourcing**: Full audit trail of all changes
- **CQRS**: Separate read/write models for complex queries
- **Stream Processing**: Real-time analytics and ML

### Migration Path

- **Current**: NATS (persistence, subject-based routing, provider-agnostic)
- **Future**: Kafka (enterprise-scale, exactly-once delivery)

### Provider Migration Strategy

The provider-agnostic design allows seamless migration between event providers:

1. **Create new implementation** of `IEventsService`
2. **Update module provider** binding
3. **Zero changes** to business logic or service code

This ensures:

- **Zero downtime** migrations
- **Risk-free** provider evaluation
- **Future-proof** architecture
- **Complete flexibility** in event system choice
