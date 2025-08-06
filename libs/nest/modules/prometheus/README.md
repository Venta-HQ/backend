# Prometheus Module

## Purpose

The Prometheus module provides protocol-agnostic metrics collection and monitoring capabilities for the Venta backend system. It automatically collects request metrics across HTTP, gRPC, and other transport protocols, providing comprehensive observability and monitoring for all services.

## Overview

This module provides:

- Protocol-agnostic metrics collection (HTTP, gRPC, WebSocket)
- Automatic request duration and throughput monitoring
- Request and response size tracking
- Status code and error rate monitoring
- Unified metrics interface across all protocols
- Extensible architecture for new protocols
- Integration with Prometheus monitoring systems

## Usage

### Module Registration

The module is automatically included via BootstrapModule in all services:

```typescript
// Automatically included in BootstrapModule.forRoot()
BootstrapModule.forRoot({
	appName: 'Your Service',
	protocol: 'http',
	// PrometheusModule is automatically registered
});
```

### Manual Registration

Register the Prometheus module manually if needed:

```typescript
import { PrometheusModule } from '@app/nest/modules/prometheus';

@Module({
	imports: [
		PrometheusModule.register({
			appName: 'Your Service',
		}),
	],
})
export class YourModule {}
```

### Metrics Endpoint

Access metrics endpoint for Prometheus scraping:

```typescript
// Metrics endpoint for Prometheus
GET / metrics;
// Returns Prometheus-formatted metrics
```

### Automatic Metrics Collection

The module automatically collects metrics for all requests:

```typescript
// HTTP requests automatically generate metrics
@Controller('users')
export class UsersController {
	@Get(':id')
	async getUser(@Param('id') id: string) {
		// Automatically generates metrics with protocol='http'
		return { id, name: 'John Doe' };
	}
}

// gRPC requests automatically generate metrics
@Controller()
export class UserServiceController {
	@GrpcMethod('UserService', 'GetUser')
	async getUser(data: { id: string }) {
		// Automatically generates metrics with protocol='grpc'
		return { id: data.id, name: 'John Doe' };
	}
}
```

### Metrics Collected

The module automatically collects these Prometheus metrics:

```typescript
// Request duration histogram
request_duration_seconds{method="GET",route="/users/:id",status_code="200",protocol="http"}

// Request count counter
requests_total{method="GET",route="/users/:id",status_code="200",protocol="http"}

// Request size histogram
request_size_bytes{method="POST",route="/users",protocol="http"}

// Response size histogram
response_size_bytes{method="GET",route="/users/:id",protocol="http"}
```

### Custom Metrics

Add custom metrics to your services:

```typescript
import { PrometheusService } from '@app/nest/modules/prometheus';

@Injectable()
export class YourService {
	constructor(private prometheusService: PrometheusService) {}

	async processData(data: any) {
		// Increment custom counter
		this.prometheusService.increment('data_processed_total', {
			type: data.type,
			status: 'success',
		});

		// Record custom histogram
		this.prometheusService.observe(
			'data_processing_duration_seconds',
			{
				type: data.type,
			},
			processingTime,
		);

		return processedData;
	}
}
```

### Environment Configuration

Configure Prometheus metrics collection:

```env
# Prometheus Configuration
PROMETHEUS_METRICS_ENABLED=true
PROMETHEUS_METRICS_PORT=9090
PROMETHEUS_METRICS_PATH=/metrics

# Metrics Collection
METRICS_COLLECTION_ENABLED=true
METRICS_DURATION_BUCKETS=0.1,0.5,1,2,5
METRICS_SIZE_BUCKETS=100,1000,10000,100000
```

## Key Benefits

- **Protocol Agnostic**: Works across HTTP, gRPC, WebSocket, and other protocols
- **Automatic Collection**: No manual instrumentation required
- **Comprehensive Metrics**: Request duration, throughput, size, and error rates
- **Observability**: Complete visibility into service performance
- **Monitoring Integration**: Seamless Prometheus integration
- **Extensible**: Easy to add support for new protocols
- **Performance**: Minimal overhead with efficient metrics collection

## Dependencies

- **Prometheus** for metrics collection and monitoring
- **NestJS** for module framework and interceptors
- **Prometheus Client** for metrics generation and formatting
