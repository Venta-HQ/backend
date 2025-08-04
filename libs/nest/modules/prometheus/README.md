# Prometheus Module

A generic Prometheus metrics module for NestJS applications that provides flexible metrics collection and exposure.

## Purpose

This module provides a centralized way to collect and expose Prometheus metrics across different services in the Venta backend system. Each application can define its own metrics based on its specific needs, while sharing common infrastructure for metrics exposure.

## Features

- **Flexible Metric Definition**: Each app defines its own metrics
- **Common Infrastructure**: Shared metrics endpoint and registry
- **Application Metrics**: Automatic uptime, version, and memory tracking
- **Metrics Factory**: Helper utilities for common metric patterns
- **Automatic Exposure**: `/metrics` endpoint for Prometheus scraping
- **Request Metrics Interceptor**: Automatic tracking of HTTP, gRPC, and WebSocket requests

## Usage

### Basic Setup

```typescript
import { PrometheusModule } from '@app/nest/modules/prometheus';

@Module({
  imports: [PrometheusModule],
  // ... other imports
})
export class AppModule {}
```

### Automatic Request Metrics

The `PrometheusModule` automatically includes request metrics tracking for all HTTP, gRPC, and WebSocket requests. Simply import the module and you'll get these metrics:

- `requests_total`: Total request count by protocol, method, path, and status code
- `request_duration_seconds`: Request duration histogram by protocol, method, and path
- `requests_in_progress`: Current in-progress requests by protocol and method
- `request_failures_total`: Total failures by protocol, method, path, and error type

### Defining App-Specific Metrics

```typescript
import { PrometheusService, MetricsFactory } from '@app/nest/modules/prometheus';

@Injectable()
export class MyAppService {
  private readonly metrics: any;

  constructor(private readonly prometheus: PrometheusService) {
    // Register metrics specific to this app
    this.metrics = this.prometheus.registerMetrics([
      // Use factory for common patterns
      ...MetricsFactory.websocketMetrics('myapp_websocket'),
      ...MetricsFactory.httpMetrics('myapp_http'),
      
      // Or define custom metrics
      MetricsFactory.counter('myapp_custom_events_total', 'Total custom events', ['event_type']),
      MetricsFactory.gauge('myapp_active_users', 'Number of active users'),
      MetricsFactory.histogram('myapp_processing_time_seconds', 'Processing time', [0.1, 0.5, 1, 2, 5], ['operation']),
    ]);
  }

  recordCustomEvent(eventType: string) {
    this.metrics.myapp_custom_events_total.inc({ event_type: eventType });
  }

  setActiveUsers(count: number) {
    this.metrics.myapp_active_users.set(count);
  }

  recordProcessingTime(operation: string, durationSeconds: number) {
    this.metrics.myapp_processing_time_seconds.observe({ operation }, durationSeconds);
  }
}
```

### WebSocket Gateway Example

```typescript
import { PrometheusService, MetricsFactory } from '@app/nest/modules/prometheus';

@Injectable()
export class WebSocketGateway {
  private readonly metrics: any;

  constructor(private readonly prometheus: PrometheusService) {
    this.metrics = this.prometheus.registerMetrics(
      MetricsFactory.websocketMetrics('websocket_gateway')
    );
  }

  onConnection(type: 'user' | 'vendor') {
    this.metrics.websocket_gateway_connections_total.inc({ type, status: 'connected' });
    this.metrics.websocket_gateway_connections_active.inc({ type });
  }

  onDisconnection(type: 'user' | 'vendor', reason: string, durationSeconds: number) {
    this.metrics.websocket_gateway_disconnections_total.inc({ type, reason });
    this.metrics.websocket_gateway_connections_active.dec({ type });
    this.metrics.websocket_gateway_connection_duration_seconds.observe({ type }, durationSeconds);
  }

  onError(type: 'user' | 'vendor', errorCode: string) {
    this.metrics.websocket_gateway_errors_total.inc({ type, error_code: errorCode });
  }
}
```

### HTTP Service Example

```typescript
import { PrometheusService, MetricsFactory } from '@app/nest/modules/prometheus';

@Injectable()
export class HttpService {
  private readonly metrics: any;

  constructor(private readonly prometheus: PrometheusService) {
    this.metrics = this.prometheus.registerMetrics(
      MetricsFactory.httpMetrics('api')
    );
  }

  recordRequest(method: string, path: string, statusCode: number, durationSeconds: number) {
    this.metrics.api_requests_total.inc({ method, path, status_code: statusCode.toString() });
    this.metrics.api_request_duration_seconds.observe({ method, path }, durationSeconds);
  }
}
```

## Metrics Factory

The `MetricsFactory` provides common metric patterns:

### WebSocket Metrics
```typescript
MetricsFactory.websocketMetrics(prefix?: string)
// Creates: connections_total, connections_active, connection_duration_seconds, errors_total, disconnections_total
```

### HTTP Metrics
```typescript
MetricsFactory.httpMetrics(prefix?: string)
// Creates: requests_total, request_duration_seconds, requests_in_progress
```

### Database Metrics
```typescript
MetricsFactory.databaseMetrics(prefix?: string)
// Creates: queries_total, query_duration_seconds, connections_active
```

### gRPC Metrics
```typescript
MetricsFactory.grpcMetrics(prefix?: string)
// Creates: requests_total, request_duration_seconds, requests_in_progress
```

### Custom Metrics
```typescript
MetricsFactory.counter(name, help, labelNames?)
MetricsFactory.gauge(name, help, labelNames?)
MetricsFactory.histogram(name, help, buckets, labelNames?)
```

## Application Metrics

The module automatically provides these common metrics:
- `application_uptime_seconds`: Application uptime
- `application_version_info`: Version information with labels
- `application_memory_usage_bytes`: Memory usage by type

## Configuration

The module automatically configures:
- Application version from `npm_package_version` environment variable
- Git commit from `GIT_COMMIT` environment variable
- Environment from `NODE_ENV` environment variable
- Automatic uptime and memory tracking

## Prometheus Integration

Once the module is imported, metrics are automatically exposed at `/metrics` endpoint in Prometheus format. Configure Prometheus to scrape this endpoint:

```yaml
scrape_configs:
  - job_name: 'venta-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

## Testing

The module includes a `resetMetrics()` method for testing purposes:

```typescript
describe('MyService', () => {
  beforeEach(async () => {
    await prometheusService.resetMetrics();
  });
});
```

## Request Metrics Interceptor

The `MetricsInterceptor` automatically tracks all requests across HTTP, gRPC, and WebSocket protocols. It provides comprehensive metrics for monitoring application performance and health.

### Metrics Provided

- **`requests_total`**: Counter tracking total requests by protocol, method, path, and status code
- **`request_duration_seconds`**: Histogram tracking request duration by protocol, method, and path
- **`requests_in_progress`**: Gauge tracking currently in-progress requests by protocol and method
- **`request_failures_total`**: Counter tracking failures by protocol, method, path, and error type

### Protocol Support

#### HTTP Requests
- Extracts method (GET, POST, etc.) and normalized path
- Tracks status codes (200, 404, 500, etc.)
- Normalizes API paths (e.g., `/api/users/123?filter=active` → `/api/users/123`)

#### gRPC Requests
- Extracts service and method names
- Tracks success/failure status
- Provides service.method path format

#### WebSocket Messages
- Extracts event type from message data
- Falls back to 'message' for generic messages
- Tracks connection and message processing

### Usage

#### Automatic Integration
The `PrometheusModule` automatically includes the metrics interceptor, so no additional configuration is needed:

```typescript
import { PrometheusModule } from '@app/nest/modules/prometheus';

@Module({
  imports: [
    PrometheusModule,
    // ... other imports
  ],
})
export class AppModule {}
```

#### Manual Registration (if needed)
If you need to customize the interceptor or use it separately:

```typescript
import { MetricsInterceptor } from '@app/nest/modules/prometheus';

@Module({
  imports: [PrometheusModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
```

### Example Metrics Output

```
# HELP requests_total Total number of requests
# TYPE requests_total counter
requests_total{protocol="http",method="GET",path="/api/users",status_code="200"} 150
requests_total{protocol="http",method="POST",path="/api/users",status_code="201"} 25
requests_total{protocol="grpc",method="getUser",path="UserService.getUser",status_code="200"} 75
requests_total{protocol="websocket",method="location_update",path="websocket",status_code="200"} 300

# HELP request_duration_seconds Duration of requests
# TYPE request_duration_seconds histogram
request_duration_seconds_bucket{protocol="http",method="GET",path="/api/users",le="0.1"} 120
request_duration_seconds_bucket{protocol="http",method="GET",path="/api/users",le="0.5"} 145
request_duration_seconds_bucket{protocol="http",method="GET",path="/api/users",le="1"} 150

# HELP requests_in_progress Number of requests currently in progress
# TYPE requests_in_progress gauge
requests_in_progress{protocol="http",method="GET"} 5
requests_in_progress{protocol="grpc",method="getUser"} 2

# HELP request_failures_total Total number of request failures
# TYPE request_failures_total counter
request_failures_total{protocol="http",method="POST",path="/api/users",error_type="ValidationError"} 3
```

## Instrumenting an App with Metrics

### Step 1: Add Prometheus Module to Your App

```typescript
// In your app module
import { PrometheusModule } from '@app/nest/modules/prometheus';

@Module({
  imports: [
    PrometheusModule,
    // ... other imports
  ],
})
export class AppModule {}
```

### Step 2: Define Your App's Metrics

Create a metrics provider file (e.g., `src/metrics.provider.ts`):

```typescript
import { PrometheusService, MetricsFactory, PrometheusMetrics } from '@app/nest/modules/prometheus';

export const APP_METRICS = 'APP_METRICS';

export interface AppMetrics {
  // Define your metric types here
  custom_events_total: PrometheusMetrics['custom_events_total'];
  processing_duration_seconds: PrometheusMetrics['processing_duration_seconds'];
  active_items: PrometheusMetrics['active_items'];
}

export function createAppMetrics(prometheusService: PrometheusService): AppMetrics {
  return prometheusService.registerMetrics([
    // Use factory for common patterns
    ...MetricsFactory.httpMetrics('api'),
    ...MetricsFactory.databaseMetrics('db'),
    
    // Define custom metrics
    MetricsFactory.counter('custom_events_total', 'Total custom events', ['event_type']),
    MetricsFactory.histogram('processing_duration_seconds', 'Processing time', [0.1, 0.5, 1, 2, 5], ['operation']),
    MetricsFactory.gauge('active_items', 'Number of active items'),
  ]) as AppMetrics;
}
```

### Step 3: Register Metrics in Your Module

```typescript
// In your app module
import { APP_METRICS, createAppMetrics } from './metrics.provider';

@Module({
  imports: [PrometheusModule],
  providers: [
    {
      provide: APP_METRICS,
      useFactory: createAppMetrics,
      inject: [PrometheusService],
    },
    // ... other providers
  ],
})
export class AppModule {}
```

### Step 4: Use Metrics in Your Services

```typescript
import { APP_METRICS, AppMetrics } from './metrics.provider';

@Injectable()
export class MyService {
  constructor(
    @Inject(APP_METRICS) private readonly metrics: AppMetrics,
  ) {}

  async processItem(itemId: string) {
    const startTime = Date.now();
    
    try {
      // Your business logic here
      const result = await this.doWork(itemId);
      
      // Record success metrics
      this.metrics.custom_events_total.inc({ event_type: 'item_processed' });
      this.metrics.processing_duration_seconds.observe(
        { operation: 'process_item' }, 
        (Date.now() - startTime) / 1000
      );
      
      return result;
    } catch (error) {
      // Record error metrics
      this.metrics.custom_events_total.inc({ event_type: 'item_error' });
      throw error;
    }
  }

  setActiveItems(count: number) {
    this.metrics.active_items.set(count);
  }
}
```

### Step 5: Access Metrics Endpoint

Once configured, your metrics will be available at `/metrics`:

```bash
curl http://localhost:3000/metrics
```

### Best Practices

1. **Use Descriptive Names**: Choose metric names that clearly describe what they measure
2. **Add Help Text**: Always provide helpful descriptions for your metrics
3. **Use Labels Wisely**: Labels add dimensionality but can cause cardinality issues
4. **Group Related Metrics**: Use consistent prefixes for related metrics
5. **Measure What Matters**: Focus on business-critical metrics and user experience
6. **Test Your Metrics**: Verify metrics are being recorded correctly

### Common Patterns

#### HTTP Request Metrics
```typescript
// In an interceptor or middleware
this.metrics.api_requests_total.inc({ 
  method: 'GET', 
  path: '/users', 
  status_code: '200' 
});
this.metrics.api_request_duration_seconds.observe(
  { method: 'GET', path: '/users' }, 
  durationSeconds
);
```

#### Database Query Metrics
```typescript
const startTime = Date.now();
try {
  const result = await this.db.query('SELECT * FROM users');
  this.metrics.db_queries_total.inc({ operation: 'select', table: 'users' });
  this.metrics.db_query_duration_seconds.observe(
    { operation: 'select', table: 'users' }, 
    (Date.now() - startTime) / 1000
  );
  return result;
} catch (error) {
  this.metrics.db_queries_total.inc({ operation: 'select', table: 'users' });
  throw error;
}
```

#### Business Logic Metrics
```typescript
// Track business events
this.metrics.orders_created_total.inc({ status: 'success' });
this.metrics.active_users.set(userCount);
this.metrics.payment_processing_duration_seconds.observe(
  { method: 'credit_card' }, 
  processingTimeSeconds
);
``` 