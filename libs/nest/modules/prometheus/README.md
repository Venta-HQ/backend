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