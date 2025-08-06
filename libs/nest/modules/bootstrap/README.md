# Bootstrap Module

## Purpose

The Bootstrap Module provides a standardized foundation for all services in the Venta backend system. It automatically configures essential modules, services, and middleware that are common across all microservices, ensuring consistent behavior, configuration, and functionality. This module eliminates boilerplate code and provides a unified service initialization pattern.

## Overview

This module provides:
- Automatic configuration of essential modules (Config, Logger, Prisma, Health, Prometheus)
- Standardized service initialization with consistent patterns
- Protocol-specific module configuration (HTTP, gRPC, WebSocket, NATS)
- Health check integration and monitoring setup
- Error handling and logging configuration
- Service naming and identification for observability
- Additional module and provider injection capabilities

## Usage

### Basic Service Configuration

Configure a service with the BootstrapModule:

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'User Service',
      protocol: 'grpc',
    }),
  ],
  // Your service-specific configuration
})
export class UserModule {}
```

### Service with Additional Modules

Add service-specific modules to the bootstrap configuration:

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'Vendor Service',
      protocol: 'grpc',
      additionalModules: [
        EventsModule.register({ serviceName: 'Vendor Service' }),
        ClientsModule.registerAsync([/* gRPC clients */]),
      ],
    }),
  ],
})
export class VendorModule {}
```

### HTTP Service Configuration

Configure an HTTP service with health checks:

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'Gateway Service',
      protocol: 'http',
      additionalModules: [
        ClerkModule.register(),
        RedisModule,
        ThrottlerModule.forRoot([/* rate limiting config */]),
      ],
    }),
  ],
})
export class GatewayModule {}
```

### Custom Health Checks

Add custom health checks for your service:

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'Location Service',
      protocol: 'grpc',
      healthChecks: async () => ({
        locationService: { status: 'up' },
        geospatialEngine: { status: 'up' },
      }),
    }),
  ],
})
export class LocationModule {}
```

### WebSocket Service Configuration

Configure a WebSocket service with authentication:

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'WebSocket Gateway',
      protocol: 'http', // WebSocket uses HTTP protocol
      additionalModules: [
        ClerkModule.register(),
        RedisModule,
        GrpcInstanceModule.register(/* location service config */),
      ],
    }),
  ],
})
export class WebsocketGatewayModule {}
```

## Configuration Options

### BootstrapOptions

```typescript
interface BootstrapOptions {
  appName: string;                    // Service name for logging and monitoring
  protocol?: 'http' | 'grpc' | 'websocket' | 'nats'; // Service protocol
  additionalModules?: any[];          // Service-specific modules to include
  additionalProviders?: any[];        // Service-specific providers to include
  healthChecks?: () => Promise<Record<string, any>>; // Custom health checks
}
```

### Automatically Included Modules

The BootstrapModule automatically includes these modules:

- **ConfigModule**: Environment configuration and validation
- **ErrorHandlingModule**: Standardized error handling
- **HealthModule**: Health checks and monitoring
- **LoggerModule**: Structured logging with service name
- **PrometheusModule**: Metrics collection and monitoring
- **PrismaModule**: Database access and connection management
- **HealthCheckModule**: HTTP health check endpoints (for HTTP services)

## Key Benefits

- **Standardization**: Consistent service configuration across all microservices
- **Reduced Boilerplate**: Automatic setup of essential modules and services
- **Protocol Support**: Optimized configuration for different service protocols
- **Observability**: Built-in logging, monitoring, and health checks
- **Flexibility**: Easy addition of service-specific modules and providers
- **Maintainability**: Centralized configuration management

## Dependencies

- **NestJS Core** for module system and dependency injection
- **ConfigModule** for environment configuration
- **LoggerModule** for structured logging
- **PrismaModule** for database access
- **HealthModule** for health monitoring
- **PrometheusModule** for metrics collection 