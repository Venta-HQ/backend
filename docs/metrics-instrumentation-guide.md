# 📊 Metrics Instrumentation Guide

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Available Factory Methods](#available-factory-methods)
- [Metric Types](#metric-types)
- [Common Patterns](#common-patterns)
- [Testing](#testing)
- [Accessing Metrics](#accessing-metrics)
- [Prometheus Configuration](#prometheus-configuration)

## 🚀 Quick Start

Quick reference for adding **Prometheus metrics** to any app in the Venta backend.

### **1. Add to Module**

```typescript
// app.module.ts
import { PrometheusModule } from '@app/nest/modules/prometheus';

@Module({
  imports: [PrometheusModule],
  // ...
})
export class AppModule {}
```

### **2. Create Metrics Provider**

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

### **3. Register in Module**

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

### **4. Use in Service**

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

## 🏭 Available Factory Methods

### **WebSocket Metrics**

```typescript
MetricsFactory.websocketMetrics('prefix')
// Creates: connections_total, connections_active, connection_duration_seconds, errors_total, disconnections_total
```

### **HTTP Metrics**

```typescript
MetricsFactory.httpMetrics('prefix')
// Creates: requests_total, request_duration_seconds, requests_in_progress
```

### **Database Metrics**

```typescript
MetricsFactory.databaseMetrics('prefix')
// Creates: queries_total, query_duration_seconds, connections_active
```

### **gRPC Metrics**

```typescript
MetricsFactory.grpcMetrics('prefix')
// Creates: requests_total, request_duration_seconds, requests_in_progress
```

### **Custom Metrics**

```typescript
MetricsFactory.counter(name, help, labelNames?)
MetricsFactory.gauge(name, help, labelNames?)
MetricsFactory.histogram(name, help, buckets, labelNames?)
```

## 📈 Metric Types

### **Counter**

**🎯 Use for**: Events that only increase (requests, errors, etc.)

**💻 Method**: `.inc(labels?)`

**📝 Example**: `requests_total.inc({ endpoint: '/api/users' })`

```typescript
// Counter example
this.metrics.requests_total.inc({ endpoint: '/api/users', method: 'GET' });
this.metrics.errors_total.inc({ type: 'validation_error' });
```

### **Gauge**

**🎯 Use for**: Values that can go up and down (active connections, memory usage)

**💻 Methods**: `.set(value)`, `.inc()`, `.dec()`

**📝 Example**: `active_users.set(42)`

```typescript
// Gauge example
this.metrics.active_connections.set(connectionCount);
this.metrics.memory_usage_bytes.set(process.memoryUsage().heapUsed);
this.metrics.queue_size.inc(); // Increment
this.metrics.queue_size.dec(); // Decrement
```

### **Histogram**

**🎯 Use for**: Distributions of values (request duration, response sizes)

**💻 Method**: `.observe(labels?, value)`

**📝 Example**: `request_duration_seconds.observe({ path: '/api' }, 0.5)`

```typescript
// Histogram example
this.metrics.request_duration_seconds.observe({ path: '/api/users' }, 0.25);
this.metrics.response_size_bytes.observe({ endpoint: '/api/data' }, 1024);
```

## 🔄 Common Patterns

### **Request/Response Tracking**

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

### **Business Event Tracking**

```typescript
// Order created
this.metrics.orders_total.inc({ status: 'created' });

// User registered
this.metrics.users_total.inc({ source: 'web' });

// Payment processed
this.metrics.payments_total.inc({ method: 'credit_card', status: 'success' });
```

### **Resource Monitoring**

```typescript
// Track active connections
this.metrics.active_connections.set(connectionCount);

// Monitor queue size
this.metrics.queue_size.set(queue.length);

// Track memory usage
this.metrics.memory_usage_bytes.set(process.memoryUsage().heapUsed);
```

## 🧪 Testing

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

## 🔍 Accessing Metrics

Once configured, metrics are available at `/metrics`:

```bash
curl http://localhost:3000/metrics
```

### **Example Metrics Output**

```
# HELP requests_total Total requests
# TYPE requests_total counter
requests_total{endpoint="/api/users",status="success"} 42
requests_total{endpoint="/api/users",status="error"} 3

# HELP request_duration_seconds Request duration in seconds
# TYPE request_duration_seconds histogram
request_duration_seconds_bucket{le="0.1"} 25
request_duration_seconds_bucket{le="0.5"} 40
request_duration_seconds_bucket{le="1"} 45
request_duration_seconds_bucket{le="+Inf"} 45
request_duration_seconds_sum 12.5
request_duration_seconds_count 45

# HELP active_connections Active connections
# TYPE active_connections gauge
active_connections 15
```

## ⚙️ Prometheus Configuration

Add to your Prometheus config:

```yaml
scrape_configs:
  - job_name: 'my-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s
```

## 📊 Complete Example

### **Service with Metrics**

```typescript
// user.service.ts
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_METRICS) private metrics: UserMetrics,
    private prisma: PrismaService,
  ) {}

  async createUser(userData: CreateUserDto) {
    const start = Date.now();
    
    try {
      const user = await this.prisma.user.create({ data: userData });
      
      // Record success metrics
      this.metrics.users_created_total.inc({ source: userData.source });
      this.metrics.user_creation_duration_seconds.observe({}, (Date.now() - start) / 1000);
      
      return user;
    } catch (error) {
      // Record error metrics
      this.metrics.user_creation_errors_total.inc({ error_type: error.name });
      throw error;
    }
  }

  async getActiveUsers() {
    const count = await this.prisma.user.count({ where: { active: true } });
    
    // Update gauge
    this.metrics.active_users.set(count);
    
    return count;
  }
}
```

### **Metrics Provider**

```typescript
// user-metrics.provider.ts
export const USER_METRICS = 'USER_METRICS';

export interface UserMetrics {
  users_created_total: any;
  user_creation_errors_total: any;
  user_creation_duration_seconds: any;
  active_users: any;
}

export function createUserMetrics(prometheusService: PrometheusService): UserMetrics {
  return prometheusService.registerMetrics([
    MetricsFactory.counter('users_created_total', 'Total users created', ['source']),
    MetricsFactory.counter('user_creation_errors_total', 'Total user creation errors', ['error_type']),
    MetricsFactory.histogram('user_creation_duration_seconds', 'User creation duration', [0.1, 0.5, 1, 2, 5]),
    MetricsFactory.gauge('active_users', 'Number of active users'),
  ]) as UserMetrics;
}
```

### **Module Configuration**

```typescript
// user.module.ts
@Module({
  imports: [PrometheusModule],
  providers: [
    UserService,
    {
      provide: USER_METRICS,
      useFactory: createUserMetrics,
      inject: [PrometheusService],
    },
  ],
})
export class UserModule {}
```

## 🎯 Best Practices

### **Metric Naming**

| Good | Bad | Reason |
|------|-----|--------|
| `http_requests_total` | `requests` | Include unit and type |
| `user_creation_duration_seconds` | `user_creation_time` | Use standard units |
| `active_connections` | `connections` | Be descriptive |

### **Label Usage**

```typescript
// ✅ Good: Useful labels
this.metrics.requests_total.inc({ 
  endpoint: '/api/users', 
  method: 'GET', 
  status: '200' 
});

// ❌ Bad: Too many labels
this.metrics.requests_total.inc({ 
  endpoint: '/api/users', 
  method: 'GET', 
  status: '200',
  user_id: '123', // High cardinality
  timestamp: '2024-01-01' // High cardinality
});
```

### **Histogram Buckets**

```typescript
// ✅ Good: Appropriate buckets for the metric
MetricsFactory.histogram('request_duration_seconds', 'Request duration', [
  0.1, 0.25, 0.5, 1, 2.5, 5, 10
]);

// ❌ Bad: Too many or inappropriate buckets
MetricsFactory.histogram('request_duration_seconds', 'Request duration', [
  0.001, 0.002, 0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.01
]);
```

## 📈 Monitoring and Alerting

### **Example Alerts**

```yaml
# prometheus/alerts.yml
groups:
  - name: app_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(requests_total{status="error"}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m])) > 2
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }} seconds"
```

### **Grafana Dashboard**

```json
{
  "dashboard": {
    "title": "Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(requests_total[5m])",
            "legendFormat": "{{endpoint}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(requests_total{status=\"error\"}[5m])",
            "legendFormat": "{{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

## 🔧 Troubleshooting

### **Common Issues**

| Issue | Solution |
|-------|----------|
| **Metrics not appearing** | Check that PrometheusModule is imported |
| **High cardinality** | Reduce number of label values |
| **Memory usage** | Use appropriate metric types and buckets |
| **Performance impact** | Avoid expensive operations in metric recording |

### **Debugging**

```typescript
// Enable debug logging
const prometheusService = new PrometheusService();
prometheusService.setDebugMode(true);

// Check registered metrics
const metrics = await prometheusService.getMetrics();
console.log(metrics);
```

---

**This metrics instrumentation guide provides everything you need to add comprehensive monitoring to your Venta backend services.** 