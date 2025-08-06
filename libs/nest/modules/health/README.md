# Health Module

## Purpose

The Health module provides health check endpoints and monitoring capabilities for the Venta backend system. It includes health check controllers, service status monitoring, dependency health checks, and integration with monitoring systems for comprehensive service observability.

## Overview

This module provides:
- Health check endpoints for monitoring and load balancers
- Service status monitoring and reporting
- Database, Redis, and external service health monitoring
- Custom health check integration capabilities
- Monitoring system integration
- Health check metrics and alerting

## Usage

### Module Registration

The module is automatically included via BootstrapModule in all services:

```typescript
// Automatically included in BootstrapModule.forRoot()
BootstrapModule.forRoot({
  appName: 'Your Service',
  protocol: 'http',
  // HealthModule is automatically registered
})
```

### Custom Health Checks

Add custom health checks for your service:

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'Your Service',
      protocol: 'http',
      healthChecks: async () => ({
        customService: { status: 'up' },
        externalApi: await checkExternalApi(),
        database: await checkDatabaseConnection(),
      }),
    }),
  ],
})
export class YourModule {}
```

### Health Check Endpoints

Access health check endpoints:

```typescript
// Basic health check
GET /health
// Response: { status: 'ok', timestamp: '2024-01-01T00:00:00Z' }

// Detailed health check
GET /health/detailed
// Response: {
//   status: 'ok',
//   checks: {
//     database: { status: 'up' },
//     redis: { status: 'up' },
//     customService: { status: 'up' }
//   }
// }

// Readiness check
GET /health/ready
// Response: { status: 'ready', timestamp: '2024-01-01T00:00:00Z' }

// Liveness check
GET /health/live
// Response: { status: 'alive', timestamp: '2024-01-01T00:00:00Z' }
```

### Custom Health Check Functions

Implement custom health check functions:

```typescript
async function checkExternalApi() {
  try {
    const response = await fetch('https://api.external.com/health');
    return { status: response.ok ? 'up' : 'down' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
}

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
}

async function checkRedisConnection() {
  try {
    await redis.ping();
    return { status: 'up' };
  } catch (error) {
    return { status: 'down', error: error.message };
  }
}
```

### Health Check Configuration

Configure health check behavior:

```env
# Health Check Configuration
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_ENABLED=true

# Monitoring Integration
HEALTH_METRICS_ENABLED=true
HEALTH_ALERTING_ENABLED=true
```

## Key Benefits

- **Monitoring**: Service health monitoring and alerting
- **Load Balancing**: Health check endpoints for load balancers
- **Debugging**: Service status information for troubleshooting
- **Reliability**: Automatic health monitoring and reporting
- **Observability**: Comprehensive service health visibility
- **Automation**: Integration with monitoring and alerting systems

## Dependencies

- **NestJS** for health check framework and endpoints
- **Database** for database connection health checks
- **Redis** for Redis connection health checks 