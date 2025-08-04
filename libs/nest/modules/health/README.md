# Health Module

## Purpose

The Health module provides health check endpoints and monitoring capabilities for the Venta backend system. It includes health check controllers, service status monitoring, and integration with monitoring systems.

## What It Contains

- **Health Controller**: REST endpoints for health checks
- **Health Service**: Service status monitoring and reporting
- **Health Checks**: Database, Redis, and external service health monitoring
- **Monitoring Integration**: Integration with monitoring and alerting systems

## Usage

This module is imported by services that need to expose health check endpoints for monitoring and load balancers.

### For Services
```typescript
// Import the health module in your service module
import { HealthModule } from '@app/nest/modules/health';

@Module({
  imports: [HealthModule],
  // ... other module configuration
})
export class MyServiceModule {}
```

### For Health Checks
```typescript
// Health check endpoint will be available at /health
// Returns service status and dependencies health
GET /health
// Response: { status: 'ok', timestamp: '2024-01-01T00:00:00Z' }

// Detailed health check
GET /health/detailed
// Response: {
//   status: 'ok',
//   checks: {
//     database: { status: 'up' },
//     redis: { status: 'up' },
//     externalService: { status: 'up' }
//   }
// }
```

## Key Benefits

- **Monitoring**: Service health monitoring and alerting
- **Load Balancing**: Health check endpoints for load balancers
- **Debugging**: Service status information for troubleshooting
- **Reliability**: Automatic health monitoring and reporting

## Dependencies

- NestJS framework
- Database connection for health checks
- Redis connection for health checks 