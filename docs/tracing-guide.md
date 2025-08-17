# 🔎 Distributed Tracing Guide

## Overview

The Venta backend uses **OpenTelemetry (OTEL)** for distributed tracing, providing complete visibility into request flows across all services. Traces automatically capture HTTP requests, database queries, message processing, and inter-service communication.

## Architecture

```
Request → RequestIdInterceptor → TracingModule → Instrumented Code → Tempo → Grafana
```

- **Request correlation**: Every request gets a unique `requestId` that flows through all operations
- **Automatic instrumentation**: HTTP, gRPC, Prisma, Redis, Socket.IO, NATS, and external calls
- **SQL visibility**: Raw SQL queries captured in span events for debugging
- **Service identification**: Proper service naming using kebab-case conventions

## Quick Start

### Viewing Traces

1. Open Grafana: `http://localhost:3000`
2. Go to **Explore** → Select **Tempo** datasource
3. Search using TraceQL (see [Search Examples](#search-examples))

### Finding Traces by Request ID

```traceql
{ span.request.id = "your-request-id-here" }
```

## Configuration

### Environment Variables

| Variable                             | Description                                | Default                           |
| ------------------------------------ | ------------------------------------------ | --------------------------------- |
| `APP_NAME`                           | Service name (auto-set by BootstrapModule) | From `APP_NAMES` constant         |
| `DOMAIN`                             | Service namespace                          | Set by BootstrapModule            |
| `NODE_ENV`                           | Deployment environment                     | -                                 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | Tempo endpoint                             | `http://localhost:4318/v1/traces` |

### Span Processing

Uses `BatchSpanProcessor` with optimized settings for all environments:

- **Batch size**: 100 spans per export
- **Export interval**: 1 second
- **Timeout**: 5 seconds

### Service Names

Services use standardized kebab-case names from `APP_NAMES`:

- `api-gateway` - Gateway Service
- `user-service` - User Microservice
- `vendor-service` - Vendor Microservice
- `location-service` - Location Microservice
- etc.

## Automatic Instrumentation

### HTTP Requests

```
span.name: "GET /api/users/{id}"
span.request.id: "req-abc-123"
span.http.method: "GET"
span.http.status_code: 200
```

### Database Queries

```
span.name: "prisma:client:findUnique"
span.db.operation.type: "SELECT"
span.db.duration.ms: 15

span.events:
  - db.query.executed:
      db.statement: "SELECT * FROM \"User\" WHERE \"id\" = $1"
      db.params: "[\"user-123\"]"
```

### NATS Messages

```
span.name: "NATS Consume: user.created"
span.messaging.system: "nats"
span.messaging.destination: "user.created"
span.request.id: "req-abc-123"  # Propagated from original request
```

### Redis Operations

```
span.name: "redis-get"
span.db.system: "redis"
span.db.operation: "get"
```

## Search Examples

### By Request ID (Primary Use Case)

```traceql
# Find specific request trace
{ span.request.id = "req-abc-123" }

# Find traces by correlation ID (NATS)
{ span.correlation.id = "corr-xyz-789" }
```

### By Service and Operation

```traceql
# All operations for a service
{ resource.service.name = "api-gateway" }

# Specific service with errors
{ resource.service.name = "user-service" && span.status = error }
```

### By Database Performance

```traceql
# Slow database queries
{ span.db.duration.ms > 100 }

# Specific query types
{ span.db.operation.type = "SELECT" }

# Slow writes
{ span.db.operation.type =~ "INSERT|UPDATE|DELETE" && span.db.duration.ms > 50 }
```

### By HTTP Performance

```traceql
# Slow HTTP requests
{ span.http.status_code >= 200 && span.duration > 1s }

# Error responses
{ span.http.status_code >= 400 }

# Specific endpoints
{ span.http.route = "/api/users/{id}" }
```

### Combined Searches

```traceql
# Slow requests for specific service
{ resource.service.name = "api-gateway" && span.duration > 500ms }

# Database errors in production
{ resource.deployment.environment = "production" && span.db.operation.type != "" && span.status = error }
```

## Request Flow Correlation

### 1. HTTP Request Arrives

- `BaseRequestIdInterceptor` generates/extracts `requestId`
- Sets `span.request.id` attribute on HTTP span
- Stores in `AsyncLocalStorage` for propagation

### 2. Database Operations

- Prisma extension captures `requestId` in logs
- `$on('query')` callback adds SQL to span events:
  ```
  db.query.executed:
    db.statement: "SELECT * FROM users WHERE id = $1"
    db.params: "[\"123\"]"
  ```

### 3. NATS Message Publishing

- `correlationId` injected into message headers
- Downstream services extract and continue trace

### 4. Logger Integration

- Logs include `requestId` when available
- Falls back to `traceId` for correlation

## Troubleshooting

### No Traces Appearing

1. **Check Tempo is running**:

   ```bash
   docker compose logs tempo
   ```

2. **Verify OTLP endpoint**:

   - Local apps: `http://localhost:4318/v1/traces`
   - Not: `http://tempo:4318/v1/traces` (Docker internal)

3. **Check service startup logs**:
   ```
   Looking for: "OpenTelemetry SDK started successfully"
   ```

### Service Shows as "Unknown"

- Ensure `APP_NAME` environment variable is set
- Check `APP_NAMES` constants are using kebab-case
- Verify `BootstrapModule.forRoot()` called with correct `appName`

### Missing SQL in Traces

- SQL appears in **span events**, not attributes
- Look for `db.query.executed` events on database spans
- Prisma instrumentation may create the span, our code adds the SQL

### TraceQL Query Errors

```traceql
# ❌ Wrong - basic search in Tempo
{}

# ❌ Wrong - metrics functions without proper setup
{} | rate()

# ✅ Correct - attribute-based searches
{ resource.service.name = "api-gateway" }
{ span.request.id = "req-123" }
```

## Performance Considerations

### Sampling

- Default: All traces captured in development
- Production: Consider sampling for high-volume services
- Set via `OTEL_TRACES_SAMPLER` environment variable

### Attribute Sizes

- **Span attributes**: Limited to ~1KB each
- **Span events**: Higher limits, used for SQL queries
- Long SQL queries stored in events, not attributes

### Storage

- Tempo retention configured in `docker/tempo/tempo-local.yaml`
- Default: 1 hour retention for local development
- Production: Configure based on storage capacity

## Development Workflow

### 1. Make a Request

```bash
curl -v http://localhost:5002/api/users/123
# Note the X-Request-ID header in response
```

### 2. Find the Trace

```traceql
{ span.request.id = "req-from-response-header" }
```

### 3. Analyze Performance

- View span timeline for bottlenecks
- Check database queries in span events
- Follow distributed calls across services

### 4. Cross-Service Communication

For **cross-pod gRPC communication**, context propagation ensures unified traces:

**Client Side** (API Gateway → gRPC Service):

- `GrpcInstance` service injects OpenTelemetry context into gRPC metadata
- Trace context flows from HTTP requests to downstream gRPC calls

**Server Side** (gRPC Service in different pod):

- Built-in `GrpcInstrumentation` automatically extracts context from incoming gRPC metadata
- Links gRPC method execution to the distributed trace
- Creates child spans instead of separate root traces

### 5. Debug Issues

- Check span status for errors
- Review span events for detailed context
- Correlate with application logs using `traceId`

## Adding Custom Spans

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

const span = tracer.startSpan('custom.operation');
span.setAttributes({
	'custom.attribute': 'value',
});

try {
	// Your code here
	span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
	span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
	span.recordException(error);
} finally {
	span.end();
}
```

## Integration with Logging

The logger automatically includes:

- `requestId` when available from AsyncLocalStorage
- `traceId` as fallback for correlation

```typescript
// Logs automatically correlated with traces
this.logger.log('User created', { userId: '123' });
// Output: { requestId: 'req-abc', traceId: '1a2b3c...', message: 'User created', userId: '123' }
```

## Related Documentation

- [Monitoring Guide](./monitoring-guide.md) - Overall observability strategy
- [Logger Documentation](../libs/nest/modules/core/logger/README.md) - Structured logging
- [Request Context Documentation](../libs/nest/modules/networking/request-context/README.md) - AsyncLocalStorage usage
