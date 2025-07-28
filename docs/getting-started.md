# Getting Started

## Prerequisites

### Required Software

- **Node.js**: v18 or higher
- **pnpm**: Package manager
- **Docker**: For containerized development
- **Docker Compose**: For local infrastructure
- **PostgreSQL**: Database (or use Docker)
- **NATS**: Event messaging (or use Docker)
- **Redis**: Cache (or use Docker)

### Optional Tools

- **NATS CLI**: For debugging NATS
- **PostgreSQL CLI**: For database management
- **ngrok**: For webhook testing

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd venta-backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Copy the environment template and configure your variables:

```bash
# Copy environment template
cp ENVIRONMENT.md .env

# Edit .env with your configuration
nano .env
```

#### Required Environment Variables

**Database**

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/venta_db
PULSE_API_KEY=your_pulse_api_key
```

**Event System (NATS)**

```bash
NATS_URL=nats://localhost:4222
```

**Cache (Redis)**

```bash
REDIS_URL=redis://:password@localhost:6379
REDIS_PASSWORD=your_redis_password
```

**Authentication**

```bash
CLERK_SECRET_KEY=your_clerk_secret_key
```

**External Services**

```bash
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name

ALGOLIA_APPLICATION_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_api_key
```

**Service URLs (Local Development)**

```bash
USER_SERVICE_URL=localhost:5000
VENDOR_SERVICE_URL=localhost:5005
LOCATION_SERVICE_URL=localhost:5001
GATEWAY_SERVICE_URL=localhost:5002
WEBSOCKET_GATEWAY_SERVICE_URL=localhost:5004
ALGOLIA_SYNC_SERVICE_URL=localhost:5006
```

### 4. Database Setup

#### Using Docker (Recommended)

```bash
# Start PostgreSQL, NATS, and Redis
docker-compose up -d cache nats

# Run database migrations
pnpm run prisma:generate
npx prisma migrate deploy
```

#### Using Local PostgreSQL

```bash
# Create database
createdb venta_db

# Run migrations
npx prisma migrate deploy
```

## Local Development

### Quick Start

Start all services with a single command:

```bash
# Build all services
pnpm run prestart:all

# Start all services
pnpm run start:all
```

### Individual Service Development

Start services individually for development:

```bash
# Start specific services
pnpm run start:user
pnpm run start:vendor
pnpm run start:location
pnpm run start:gateway
pnpm run start:websocket-gateway
pnpm run start:algolia-sync
```

### Service Ports

| Service           | Port | Description                        |
| ----------------- | ---- | ---------------------------------- |
| User Service      | 5000 | User management and authentication |
| Location Service  | 5001 | Real-time location tracking        |
| Gateway           | 5002 | HTTP API gateway                   |
| WebSocket Gateway | 5004 | Real-time WebSocket connections    |
| Vendor Service    | 5005 | Vendor management                  |
| Algolia Sync      | 5006 | Search index synchronization       |
| NATS Server       | 4222 | Event messaging                    |
| NATS HTTP         | 8222 | NATS monitoring                    |

### Development Workflow

1. **Start Infrastructure**

   ```bash
   docker-compose up -d
   ```

2. **Start Services**

   ```bash
   pnpm run start:all
   ```

3. **Monitor Logs**

   ```bash
   # View all service logs
   docker-compose logs -f

   # View specific service logs
   docker-compose logs -f nats
   docker-compose logs -f cache
   ```

4. **Health Checks**

   ```bash
   # Check gateway health
   curl http://localhost:5002/health

   # Check algolia-sync health
   curl http://localhost:5006/health

   # Check NATS server health
   curl http://localhost:8222/healthz

   # Check event system
   curl http://localhost:5006/health/events
   ```

## Docker Development

### Building Images

#### Build Base Image

```bash
docker build -f Dockerfile.base -t venta-base .
```

#### Build Service Images

```bash
# Build all services
docker build -f apps/user/Dockerfile -t venta-user .
docker build -f apps/vendor/Dockerfile -t venta-vendor .
docker build -f apps/location/Dockerfile -t venta-location .
docker build -f apps/gateway/Dockerfile -t venta-gateway .
docker build -f apps/websocket-gateway/Dockerfile -t venta-websocket .
docker build -f apps/algolia-sync/Dockerfile -t venta-algolia-sync .
```

### Docker Compose Development

Create a `docker-compose.dev.yml` for development:

```yaml
version: '3.8'

services:
  user-service:
    build:
      context: .
      dockerfile: apps/user/Dockerfile
      target: development
    ports:
      - '5000:5000'
    environment:
      - NODE_ENV=development
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules

  vendor-service:
    build:
      context: .
      dockerfile: apps/vendor/Dockerfile
      target: development
    ports:
      - '5005:5005'
    environment:
      - NODE_ENV=development
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules

  # ... other services
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e
```

### Testing Event System

```bash
# Test event publishing
curl -X POST http://localhost:5002/vendor \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Vendor", "description": "Test"}'

# Check if Algolia was updated
curl http://localhost:5006/health/events
```

## Monitoring & Debugging

### Logs

#### Service Logs

```bash
# View service logs
pnpm run start:user 2>&1 | tee logs/user.log

# View Docker logs
docker-compose logs -f user-service
```

#### Redis Debugging

```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# Monitor pub/sub
redis-cli monitor

# Check failed events
redis-cli lrange failed_events 0 -1
```

### Health Monitoring

#### Service Health

```bash
# Check all services
for port in 5000 5001 5002 5004 5005 5006; do
  echo "Service on port $port:"
  curl -s http://localhost:$port/health || echo "Service not responding"
done
```

#### Event System Health

```bash
# Check event processing
curl http://localhost:5006/health/events

# Expected response
{
  "status": "ok",
  "service": "algolia-sync-events",
  "failedEventsCount": 0,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Production Deployment

### Environment Variables

For production, ensure all environment variables are properly configured:

```bash
# Required for production
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
CLERK_SECRET_KEY=...
# ... all other required variables
```

### Docker Production Builds

```bash
# Build production images
docker build -f apps/gateway/Dockerfile -t venta-gateway:prod .
docker build -f apps/user/Dockerfile -t venta-user:prod .
# ... build other services

# Run production containers
docker run -d --name venta-gateway -p 5002:5002 venta-gateway:prod
docker run -d --name venta-user -p 5000:5000 venta-user:prod
# ... run other services
```

### Health Checks

Implement health checks in your deployment:

```bash
# Kubernetes health check example
livenessProbe:
  httpGet:
    path: /health
    port: 5002
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 5002
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Troubleshooting

### Common Issues

#### Services Won't Start

1. Check environment variables are set
2. Verify database connection
3. Check Redis connection
4. Review service logs

#### Events Not Processing

1. Check Redis pub/sub is working
2. Verify event consumer is running
3. Check Algolia API credentials
4. Review failed events count

#### Performance Issues

1. Monitor Redis memory usage
2. Check database connection pooling
3. Review service resource usage
4. Monitor network latency

### Debug Commands

```bash
# Check service status
ps aux | grep node

# Check port usage
netstat -tulpn | grep :500

# Check Docker containers
docker ps -a

# Check Redis memory
redis-cli info memory

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

## Next Steps

1. **Explore the API**: Check the [API Documentation](./api.md)
2. **Understand Events**: Read the [Event System Documentation](./events.md)
3. **Review Architecture**: See the [Architecture Overview](./architecture.md)
4. **Set up Monitoring**: Configure logging and metrics
5. **Write Tests**: Add tests for your specific use cases
