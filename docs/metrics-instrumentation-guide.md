# Metrics Instrumentation Guide

Quick reference for adding Prometheus metrics to any app in the Venta backend.

## Quick Start

### 1. Add to Module
```typescript
// app.module.ts
import { PrometheusModule } from '@app/nest/modules/prometheus';

@Module({
  imports: [PrometheusModule],
  // ...
})
export class AppModule {}
```

### 2. Create Metrics Provider
```typescript
// metrics.provider.ts
import { PrometheusService, MetricsFactory } from '@app/nest/modules/prometheus';

export const APP_METRICS = 'APP_METRICS';

export interface AppMetrics {
  // Define your metrics here
  requests_total: any;
  processing_time_seconds: any;
}

export function createAppMetrics(prometheusService: PrometheusService): AppMetrics {
  return prometheusService.registerMetrics([
    MetricsFactory.counter('requests_total', 'Total requests', ['endpoint']),
    MetricsFactory.histogram('processing_time_seconds', 'Processing time', [0.1, 0.5, 1, 2, 5]),
  ]) as AppMetrics;
}
```

### 3. Register in Module
```typescript
// app.module.ts
providers: [
  {
    provide: APP_METRICS,
    useFactory: createAppMetrics,
    inject: [PrometheusService],
  },
]
```

### 4. Use in Service
```typescript
// my.service.ts
@Injectable()
export class MyService {
  constructor(@Inject(APP_METRICS) private metrics: AppMetrics) {}

  async process() {
    const start = Date.now();
    try {
      const result = await this.doWork();
      this.metrics.requests_total.inc({ endpoint: '/process' });
      this.metrics.processing_time_seconds.observe({}, (Date.now() - start) / 1000);
      return result;
    } catch (error) {
      this.metrics.requests_total.inc({ endpoint: '/process', status: 'error' });
      throw error;
    }
  }
}
```

## Available Factory Methods

### WebSocket Metrics
```typescript
MetricsFactory.websocketMetrics('prefix')
// Creates: connections_total, connections_active, connection_duration_seconds, errors_total, disconnections_total
```

### HTTP Metrics
```typescript
MetricsFactory.httpMetrics('prefix')
// Creates: requests_total, request_duration_seconds, requests_in_progress
```

### Database Metrics
```typescript
MetricsFactory.databaseMetrics('prefix')
// Creates: queries_total, query_duration_seconds, connections_active
```

### gRPC Metrics
```typescript
MetricsFactory.grpcMetrics('prefix')
// Creates: requests_total, request_duration_seconds, requests_in_progress
```

### Custom Metrics
```typescript
MetricsFactory.counter(name, help, labelNames?)
MetricsFactory.gauge(name, help, labelNames?)
MetricsFactory.histogram(name, help, buckets, labelNames?)
```

## Metric Types

### Counter
- **Use for**: Events that only increase (requests, errors, etc.)
- **Method**: `.inc(labels?)`
- **Example**: `requests_total.inc({ endpoint: '/api/users' })`

### Gauge
- **Use for**: Values that can go up and down (active connections, memory usage)
- **Methods**: `.set(value)`, `.inc()`, `.dec()`
- **Example**: `active_users.set(42)`

### Histogram
- **Use for**: Distributions of values (request duration, response sizes)
- **Method**: `.observe(labels?, value)`
- **Example**: `request_duration_seconds.observe({ path: '/api' }, 0.5)`

## Common Patterns

### Request/Response Tracking
```typescript
const start = Date.now();
try {
  const result = await this.processRequest();
  this.metrics.requests_total.inc({ status: 'success' });
  this.metrics.request_duration_seconds.observe({}, (Date.now() - start) / 1000);
  return result;
} catch (error) {
  this.metrics.requests_total.inc({ status: 'error' });
  throw error;
}
```

### Business Event Tracking
```typescript
// Order created
this.metrics.orders_total.inc({ status: 'created' });

// User registered
this.metrics.users_total.inc({ source: 'web' });

// Payment processed
this.metrics.payments_total.inc({ method: 'credit_card', status: 'success' });
```

### Resource Monitoring
```typescript
// Track active connections
this.metrics.active_connections.set(connectionCount);

// Monitor queue size
this.metrics.queue_size.set(queue.length);

// Track memory usage
this.metrics.memory_usage_bytes.set(process.memoryUsage().heapUsed);
```

## Testing

```typescript
describe('MyService', () => {
  beforeEach(async () => {
    await prometheusService.resetMetrics();
  });

  it('should record metrics', async () => {
    await service.process();
    
    const metrics = await prometheusService.getMetrics();
    expect(metrics).toContain('requests_total');
  });
});
```

## Accessing Metrics

Once configured, metrics are available at `/metrics`:

```bash
curl http://localhost:3000/metrics
```

## Prometheus Configuration

Add to your Prometheus config:

```yaml
scrape_configs:
  - job_name: 'my-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
``` 