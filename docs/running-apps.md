# Running Venta Backend Apps Individually

This guide explains how to run each application in the Venta backend monorepo individually for development and testing purposes.

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- pnpm package manager
- Git

## Quick Start

### 1. Start Dependencies

First, start all the required infrastructure services:

```bash
# Start all services (PostgreSQL, Redis, NATS, monitoring)
npm run docker:up

# Check service status
docker-compose ps
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Generate Prisma client
npm run prisma:generate
```

### 3. Run Individual Apps

Each app can be run individually using standard NestJS CLI commands:

```bash
# Development mode (with hot reload)
nest start gateway --watch
nest start user --watch
nest start vendor --watch
nest start location --watch
nest start websocket-gateway --watch
nest start algolia-sync --watch

# Production mode
nest build gateway
nest build user
nest build vendor
nest build location
nest build websocket-gateway
nest build algolia-sync
```

## Available Applications

### 1. Gateway Service (Port 3000)
- **Purpose**: HTTP API gateway, authentication, request routing
- **Dependencies**: PostgreSQL, Redis, NATS, Clerk, Cloudinary
- **Key Features**: 
  - User authentication and authorization
  - File uploads
  - Rate limiting
  - Webhook processing

### 2. User Service (Port 3001)
- **Purpose**: User management, subscriptions, vendor ownership
- **Dependencies**: PostgreSQL, NATS, Clerk
- **Key Features**:
  - User CRUD operations
  - Subscription management
  - Clerk webhook processing
  - Vendor ownership

### 3. Vendor Service (Port 3002)
- **Purpose**: Vendor data management
- **Dependencies**: PostgreSQL, NATS, Algolia
- **Key Features**:
  - Vendor CRUD operations
  - Search indexing
  - Data validation

### 4. Location Service (Port 3003)
- **Purpose**: Real-time location tracking and geospatial operations
- **Dependencies**: PostgreSQL, Redis, NATS
- **Key Features**:
  - Location updates
  - Geospatial queries
  - Real-time location broadcasting

### 5. WebSocket Gateway (Port 3004)
- **Purpose**: Real-time communication and connection management
- **Dependencies**: Redis, NATS, Location Service
- **Key Features**:
  - WebSocket connections
  - Real-time messaging
  - Connection health monitoring

### 6. Algolia Sync Service (Port 3005)
- **Purpose**: Data synchronization with Algolia search
- **Dependencies**: NATS, Algolia
- **Key Features**:
  - Search index management
  - Data synchronization
  - Index optimization

## Environment Configuration

### Default Environment Variables

The apps use default environment variables for local development. You can override them by:

1. **Using environment files**:
   ```bash
   npm run dev:gateway --env .env.local
   ```

2. **Setting environment variables directly**:
   ```bash
   DATABASE_URL=your_db_url npm run dev:gateway
   ```

### Key Environment Variables

```bash
# Database
DATABASE_URL=postgresql://venta:venta123@localhost:5432/venta

# Redis
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=your_redis_password

# NATS
NATS_URL=nats://localhost:4222

# External Services
CLERK_SECRET_KEY=your_clerk_secret
CLOUDINARY_API_KEY=your_cloudinary_key
ALGOLIA_API_KEY=your_algolia_key
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test:run

# Run tests for specific app
nest test gateway
nest test user
nest test vendor
nest test location
nest test websocket-gateway
nest test algolia-sync

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test
```

### Load Testing

```bash
# Run load test for Gateway service
npm run load:gateway

# Custom load test configuration
CONCURRENCY=20 DURATION=120 RPS=200 npm run load:gateway
```

## Development Workflow

### 1. Start Infrastructure

```bash
# Start all required services
npm run docker:up

# Verify services are running
docker-compose ps
```

### 2. Run App in Development Mode

```bash
# Start the app you're working on
npm run dev:gateway

# In another terminal, start dependent services if needed
npm run dev:user
npm run dev:location
```

### 3. Run Tests

```bash
# Run tests for the app you're working on
nest test gateway

# Run all tests
npm run test:run
```

### 4. Monitor Logs

```bash
# View Docker service logs
npm run docker:logs

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f nats
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Use a different port
   nest start gateway --watch --port 3001
   ```

2. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Restart PostgreSQL
   docker-compose restart postgres
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis status
   docker-compose exec redis redis-cli ping
   
   # Restart Redis
   docker-compose restart redis
   ```

4. **NATS Connection Issues**
   ```bash
   # Check NATS status
   curl http://localhost:8222/healthz
   
   # Restart NATS
   docker-compose restart nats
   ```

### Service Health Checks

```bash
# Check all service health
docker-compose ps

# Check specific service logs
docker-compose logs service-name

# Restart all services
docker-compose restart
```

## Monitoring

### Grafana Dashboard
- **URL**: http://localhost:3001
- **Default**: Anonymous access enabled
- **Data Source**: Loki (logs)

### Loki Logs
- **URL**: http://localhost:3100
- **Purpose**: Centralized logging

### Service Health Endpoints
- Gateway: http://localhost:3000/health
- User: http://localhost:3001/health
- Vendor: http://localhost:3002/health
- Location: http://localhost:3003/health
- WebSocket: http://localhost:3004/health
- Algolia Sync: http://localhost:3005/health

## Production Considerations

### Environment Variables
- Use proper secrets management
- Set production database URLs
- Configure external service credentials
- Set appropriate CORS origins

### Security
- Use HTTPS in production
- Configure proper authentication
- Set up rate limiting
- Enable request logging

### Performance
- Use connection pooling for databases
- Configure Redis clustering if needed
- Set up NATS clustering for high availability
- Monitor resource usage

## Next Steps

1. **Set up your development environment** following this guide
2. **Run the apps individually** to understand their behavior
3. **Write tests** for the functionality you're working on
4. **Run load tests** to ensure performance
5. **Monitor logs** to debug issues
6. **Contribute** to the testing strategy

For more information about testing, see [Testing Strategy](./testing-strategy.md). 