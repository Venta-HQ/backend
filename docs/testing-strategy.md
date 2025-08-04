# Testing Strategy for Venta Backend

This document outlines the testing strategy for each application in the Venta backend monorepo.

## Overview

The Venta backend consists of multiple microservices that need different types of testing based on their responsibilities and dependencies.

## Testing Categories

### 1. Unit Tests
- **Purpose**: Test individual functions, methods, and classes in isolation
- **Scope**: Single file or module
- **Dependencies**: Mocked external dependencies
- **Framework**: Vitest
- **Coverage**: Aim for 80%+ coverage

### 2. Integration Tests
- **Purpose**: Test interactions between modules and external services
- **Scope**: Multiple modules or services
- **Dependencies**: Real or mocked external services
- **Framework**: Vitest with TestContainers or mocked services

### 3. End-to-End Tests
- **Purpose**: Test complete user workflows
- **Scope**: Entire application stack
- **Dependencies**: Real external services
- **Framework**: Vitest with supertest for HTTP APIs

### 4. Load Tests
- **Purpose**: Test performance under load
- **Scope**: Critical endpoints and workflows
- **Framework**: Node.js CLI tools (as per project preferences)

## Application-Specific Testing Requirements

### 1. Gateway Service (`apps/gateway`)

**Responsibilities**:
- HTTP API gateway
- Authentication and authorization
- Request routing
- Rate limiting
- File uploads

**Required Tests**:

#### Unit Tests
- `AuthGuard` - Authentication logic
- `ThrottlerGuard` - Rate limiting logic
- `UploadController` - File upload validation and processing
- `UserController` - User-related endpoint logic
- `VendorController` - Vendor-related endpoint logic
- `WebhookController` - Webhook processing logic
- Router configuration

#### Integration Tests
- Authentication flow with Clerk
- File upload to Cloudinary
- Webhook signature verification
- Service communication (gRPC calls to other services)
- Redis caching behavior

#### End-to-End Tests
- Complete user registration flow
- Vendor creation and management
- File upload workflows
- Webhook processing workflows

#### Load Tests
- High-traffic scenarios
- File upload performance
- Concurrent user sessions

### 2. User Service (`apps/user`)

**Responsibilities**:
- User management
- Subscription handling
- Vendor ownership
- Clerk integration

**Required Tests**:

#### Unit Tests
- `ClerkService` - Clerk API interactions
- `SubscriptionService` - Subscription logic
- `VendorService` - Vendor ownership logic
- `ClerkController` - User management endpoints
- `SubscriptionController` - Subscription endpoints
- `VendorController` - Vendor ownership endpoints

#### Integration Tests
- Clerk webhook processing
- Database operations (Prisma)
- Event publishing (NATS)
- Subscription status management

#### End-to-End Tests
- User creation and management
- Subscription lifecycle
- Vendor ownership transfer

#### Load Tests
- User registration performance
- Subscription processing

### 3. Vendor Service (`apps/vendor`)

**Responsibilities**:
- Vendor CRUD operations
- Vendor data management

**Required Tests**:

#### Unit Tests
- `VendorService` - Business logic
- `VendorController` - gRPC endpoint handlers
- Data validation and transformation

#### Integration Tests
- Database operations
- Event publishing for vendor changes
- Algolia sync integration

#### End-to-End Tests
- Vendor creation, update, deletion
- Vendor search functionality

#### Load Tests
- Vendor CRUD operations under load

### 4. Location Service (`apps/location`)

**Responsibilities**:
- Real-time location tracking
- Location-based queries
- Geospatial operations

**Required Tests**:

#### Unit Tests
- `LocationService` - Location calculation logic
- `LocationController` - gRPC endpoint handlers
- Geospatial algorithms
- Distance calculations

#### Integration Tests
- Redis location storage
- Real-time location updates
- Location-based queries
- Event publishing for location changes

#### End-to-End Tests
- Real-time location tracking
- Location-based vendor discovery
- Location history

#### Load Tests
- Concurrent location updates
- Location query performance

### 5. WebSocket Gateway (`apps/websocket-gateway`)

**Responsibilities**:
- Real-time communication
- Connection management
- Location broadcasting

**Required Tests**:

#### Unit Tests
- `UserLocationGateway` - User location broadcasting
- `VendorLocationGateway` - Vendor location broadcasting
- `UserConnectionManagerService` - Connection management
- `VendorConnectionManagerService` - Connection management
- `ConnectionHealthService` - Health monitoring
- WebSocket authentication logic

#### Integration Tests
- WebSocket connection lifecycle
- Real-time message broadcasting
- Connection health monitoring
- Rate limiting for WebSocket connections

#### End-to-End Tests
- Real-time location updates
- Connection stability
- Message delivery reliability

#### Load Tests
- Concurrent WebSocket connections
- Message broadcasting performance
- Connection stability under load

### 6. Algolia Sync Service (`apps/algolia-sync`)

**Responsibilities**:
- Data synchronization with Algolia
- Search index management

**Required Tests**:

#### Unit Tests
- `AlgoliaSyncService` - Sync logic
- Data transformation for Algolia
- Index management logic

#### Integration Tests
- Algolia API interactions
- Event processing for data changes
- Index synchronization

#### End-to-End Tests
- Complete sync workflows
- Data consistency verification

#### Load Tests
- Large dataset synchronization
- Sync performance under load

## Testing Infrastructure

### Test Environment Setup

1. **Database**: Use TestContainers for PostgreSQL
2. **Cache**: Use TestContainers for Redis
3. **Message Broker**: Use TestContainers for NATS
4. **External Services**: Mock Clerk, Cloudinary, and Algolia APIs

### Test Data Management

- Use factories for test data creation
- Implement database seeding for integration tests
- Use isolated test databases per test suite

### Mocking Strategy

- Mock external API calls (Clerk, Cloudinary, Algolia)
- Mock gRPC service calls between services
- Use in-memory implementations for Redis and NATS in unit tests

## Test Execution

### Commands
```bash
# Run all tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests for specific app
npx nx test gateway
npx nx test user
npx nx test vendor
npx nx test location
npx nx test websocket-gateway
npx nx test algolia-sync

# Run load tests
npm run test:load
```

### CI/CD Integration

- Run unit and integration tests on every PR
- Run end-to-end tests on main branch
- Run load tests before production deployments
- Generate and store coverage reports

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, descriptive test names
3. **Arrange-Act-Assert**: Follow AAA pattern for test structure
4. **Mock External Dependencies**: Don't rely on external services in tests
5. **Test Data Cleanup**: Clean up test data after each test
6. **Performance**: Keep tests fast and efficient
7. **Coverage**: Aim for meaningful coverage, not just percentage

## Monitoring and Metrics

- Track test execution time
- Monitor test flakiness
- Track coverage trends
- Alert on test failures in CI/CD

## Future Considerations

- Implement contract testing for service interactions
- Add chaos engineering tests for resilience
- Implement performance regression testing
- Add security testing for authentication and authorization 