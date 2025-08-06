# Health Module

## Purpose

The Health Module provides comprehensive health checking capabilities across all services in the Venta backend system. It automatically provides health check endpoints, custom health checks, and integrates with monitoring systems to ensure service reliability and availability.

## Overview

This module provides:

- Automatic health check endpoints
- Custom health check support
- Service status monitoring
- Database connectivity checks
- External service dependency checks
- Health metrics and reporting

## Usage

### Module Registration

The HealthModule is automatically included by BootstrapModule:

```typescript
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.USER,
			protocol: 'grpc',
		}),
	],
})
export class UserModule {}
```

The module automatically uses the app name from ConfigService.

### Custom Health Checks

Add custom health checks to your service:

```typescript
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.USER,
			protocol: 'grpc',
			healthChecks: async () => ({
				database: { status: 'up', responseTime: 15 },
				externalApi: { status: 'up', lastCheck: new Date() },
				cache: { status: 'up', hitRate: 0.95 },
			}),
		}),
	],
})
export class UserModule {}
```

### Health Check Endpoint

Access health status at the `/health` endpoint:

```bash
curl http://localhost:3000/health
```

Example response:

```json
{
	"status": "ok",
	"timestamp": "2024-01-01T00:00:00.000Z",
	"service": "user-service",
	"checks": {
		"database": {
			"status": "up",
			"responseTime": 15
		},
		"externalApi": {
			"status": "up",
			"lastCheck": "2024-01-01T00:00:00.000Z"
		}
	}
}
```

### Health Check Types

Different types of health checks are available:

```typescript
// Basic health check
healthChecks: async () => ({
  status: 'up',
  timestamp: new Date(),
}),

// Detailed health check with multiple services
healthChecks: async () => ({
  database: await checkDatabaseConnection(),
  redis: await checkRedisConnection(),
  externalApi: await checkExternalApi(),
}),

// Health check with metrics
healthChecks: async () => ({
  database: {
    status: 'up',
    responseTime: await measureDatabaseResponseTime(),
    connections: await getActiveConnections(),
  },
}),
```

## Configuration

The HealthModule automatically configures itself using:

- **Service Name**: Retrieved from ConfigService (APP_NAME environment variable)
- **Health Endpoint**: Available at `/health` by default
- **Custom Checks**: Configurable via BootstrapModule options

### Environment Variables

```bash
# Required
APP_NAME=User Service

# Optional
HEALTH_CHECK_PATH=/health
HEALTH_CHECK_TIMEOUT=5000
```

## Key Benefits

- **Automatic Health Checks**: Built-in health check endpoints
- **Custom Checks**: Easy addition of service-specific health checks
- **Service Identification**: Automatic service name labeling
- **Monitoring Integration**: Compatible with monitoring systems
- **Performance**: Minimal overhead with efficient health checking
- **Flexibility**: Support for various health check types

## Dependencies

- **NestJS Core** for dependency injection and module system
- **ConfigModule** for service name and configuration
- **Terminus** for health check framework
