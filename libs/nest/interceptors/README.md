# NestJS Interceptors Library

## Purpose

The NestJS Interceptors Library provides reusable interceptors that can be used across all microservices in the Venta backend system. These interceptors handle cross-cutting concerns like metrics collection, request ID propagation, and other common functionality.

## Overview

This library provides:

- **Metrics interceptors** for collecting performance and monitoring data
- **Request ID interceptors** for correlation ID propagation across services
- **Protocol-specific interceptors** for gRPC, HTTP, and NATS
- **Reusable patterns** for common interceptor functionality

## Organization

### Interceptor Categories

```
libs/nest/interceptors/
├── metrics/                    # Performance and monitoring interceptors
│   ├── metrics.interceptor.ts  # Main metrics collection interceptor
│   ├── metrics.interceptor.spec.ts
│   └── index.ts
├── request-id/                 # Request correlation interceptors
│   ├── base-request-id.interceptor.ts      # Base interceptor class
│   ├── grpc-request-id.interceptor.ts      # gRPC-specific implementation
│   ├── nats-request-id.interceptor.ts      # NATS-specific implementation
│   └── index.ts
└── index.ts                    # Main export file
```

### Interceptor Types

#### **Metrics Interceptors** (`metrics/`)

Performance monitoring and observability:

- **MetricsInterceptor**: Collects request duration, size, and count metrics
- **Protocol-agnostic**: Works with HTTP, gRPC, and NATS
- **Prometheus integration**: Exports metrics for monitoring

#### **Request ID Interceptors** (`request-id/`)

Request correlation and tracing:

- **BaseRequestIdInterceptor**: Abstract base class for request ID extraction
- **GrpcRequestIdInterceptor**: gRPC-specific request ID handling
- **NatsRequestIdInterceptor**: NATS-specific correlation ID handling

## Usage

### Direct Import

```typescript
import { MetricsInterceptor } from '@venta/nest/interceptors';

@Module({
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: MetricsInterceptor,
		},
	],
})
export class YourModule {}
```

### Module Integration

Modules can import and provide interceptors:

```typescript
import { MetricsInterceptor } from '@venta/nest/interceptors';

@Module({
	imports: [PrometheusModule],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: MetricsInterceptor,
		},
	],
})
export class YourModule {}
```

### Request ID Interceptors

```typescript
import { GrpcRequestIdInterceptor, NatsRequestIdInterceptor } from '@venta/nest/interceptors';

@Module({
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: GrpcRequestIdInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: NatsRequestIdInterceptor,
		},
	],
})
export class YourModule {}
```

## Benefits

- **Reusability**: Interceptors can be used across all services
- **Consistency**: Standardized patterns for common functionality
- **Maintainability**: Centralized interceptor logic
- **Testing**: Isolated testing of interceptor functionality
- **Flexibility**: Can be imported directly or through modules

## Development Workflow

1. **Create interceptor**: Add new interceptor to appropriate category
2. **Update index**: Add exports to category index file
3. **Test**: Ensure interceptor works across all protocols
4. **Document**: Update this README with usage examples
5. **Module integration**: Update modules to use new interceptors

## Integration with Modules

While interceptors are defined in this library, they are typically **provided by modules** to ensure proper dependency injection and configuration. This pattern allows:

- **Modules to configure** interceptors with their specific dependencies
- **Interceptors to remain** protocol-agnostic and reusable
- **Clean separation** between interceptor logic and module configuration
