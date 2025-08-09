# Prometheus Module

## Purpose

The Prometheus Module provides comprehensive metrics collection and monitoring capabilities across all services in the Venta backend system. It automatically collects HTTP/gRPC request metrics, custom business metrics, and provides a Prometheus-compatible metrics endpoint for monitoring and alerting.

## Overview

This module provides:

- Automatic HTTP/gRPC request metrics collection
- Custom business metrics support
- Prometheus-compatible metrics endpoint
- Request duration, count, and error rate tracking
- Service identification and labeling
- Metrics aggregation and reporting

## Usage

### Module Registration

The PrometheusModule is automatically included by BootstrapModule:

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

### Service Injection

Inject PrometheusService into your services for custom metrics:

```typescript
import { PrometheusService } from '@venta/nest/modules';

@Injectable()
export class UserService {
	constructor(private prometheusService: PrometheusService) {}

	async createUser(userData: CreateUserData) {
		const timer = this.prometheusService.startTimer('user_creation_duration');

		try {
			const user = await this.userRepository.create(userData);
			this.prometheusService.incrementCounter('users_created_total');
			timer.end();
			return user;
		} catch (error) {
			this.prometheusService.incrementCounter('users_creation_errors_total');
			timer.end();
			throw error;
		}
	}
}
```

### Custom Metrics

Create and use custom metrics:

```typescript
// Counter for tracking events
this.prometheusService.incrementCounter('orders_processed_total', {
	status: 'success',
	region: 'us-east-1',
});

// Gauge for current values
this.prometheusService.setGauge('active_users', 150);

// Histogram for request duration
const timer = this.prometheusService.startTimer('api_request_duration');
// ... perform operation
timer.end();
```

### Metrics Endpoint

Access metrics at the `/metrics` endpoint:

```bash
curl http://localhost:3000/metrics
```

Example output:

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/users",status="200",service="user-service"} 150

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",path="/users",le="0.1"} 120
http_request_duration_seconds_bucket{method="GET",path="/users",le="0.5"} 145
http_request_duration_seconds_bucket{method="GET",path="/users",le="1"} 150
```

## Configuration

The PrometheusModule automatically configures itself using:

- **Service Name**: Retrieved from ConfigService (APP_NAME environment variable)
- **Metrics Endpoint**: Available at `/metrics` by default
- **Automatic Interceptors**: HTTP and gRPC request metrics collection

### Environment Variables

```bash
# Required
APP_NAME=User Service

# Optional
PROMETHEUS_PORT=9090
PROMETHEUS_PATH=/metrics
```

## Key Benefits

- **Automatic Metrics**: HTTP/gRPC request metrics collected automatically
- **Custom Metrics**: Easy creation and tracking of business metrics
- **Service Identification**: Automatic service name labeling
- **Prometheus Compatible**: Standard metrics format for monitoring
- **Performance**: Minimal overhead with efficient metrics collection
- **Flexibility**: Support for counters, gauges, and histograms

## Dependencies

- **NestJS Core** for dependency injection and module system
- **ConfigModule** for service name and configuration
- **Prometheus Client** for metrics collection and formatting
