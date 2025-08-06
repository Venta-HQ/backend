# PrometheusModule

A protocol-agnostic Prometheus metrics module for NestJS applications that supports HTTP, gRPC, and other transport protocols.

## Features

- **Protocol-Agnostic**: Works seamlessly across HTTP, gRPC, and other transport protocols
- **Automatic Protocol Detection**: Automatically detects the request context type and applies appropriate metrics collection
- **Unified Metrics Interface**: Consistent metrics collection regardless of the underlying protocol
- **Extensible Architecture**: Easy to add support for new protocols (WebSocket, GraphQL, etc.)

## Architecture

The module uses a factory pattern to provide protocol-specific implementations while maintaining a unified interface:

```
RequestMetrics Interface
├── HttpRequestMetricsFactory (HTTP)
├── GrpcRequestMetricsFactory (gRPC)
└── [Future: WebSocketRequestMetricsFactory, etc.]
```

### Core Components

- **`RequestMetrics`**: Protocol-agnostic interface for request metrics
- **`RequestMetricsFactory`**: Factory interface for creating protocol-specific metrics
- **`MetricsFactoryRegistry`**: Registry that provides the appropriate factory based on context type
- **`MetricsInterceptor`**: Global interceptor that collects metrics using the factory pattern

## Installation

```bash
pnpm add @app/nest/modules/prometheus
```

## Usage

### Basic Setup

```typescript
import { PrometheusModule } from '@app/nest/modules/prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      appName: 'My Service',
    }),
  ],
})
export class AppModule {}
```

### Supported Protocols

#### HTTP Services

The module automatically detects HTTP requests and collects:
- Request method (GET, POST, etc.)
- Request route/path
- Request size (from Content-Length header)
- Response size
- Request duration
- HTTP status code

#### gRPC Services

For gRPC requests, the module collects:
- Method name (from handler)
- Protocol identifier ('grpc')
- Response size
- Request duration
- Status code (typically 200 for success)

#### Future Protocols

The architecture is designed to easily support additional protocols:
- WebSocket
- GraphQL
- NATS
- Custom protocols

## Metrics Collected

The module automatically collects the following Prometheus metrics:

### `request_duration_seconds`
- **Type**: Histogram
- **Labels**: `method`, `route`, `status_code`, `protocol`
- **Description**: Request duration in seconds

### `requests_total`
- **Type**: Counter
- **Labels**: `method`, `route`, `status_code`, `protocol`
- **Description**: Total number of requests

### `request_size_bytes`
- **Type**: Histogram
- **Labels**: `method`, `route`, `protocol`
- **Description**: Request size in bytes (when available)

### `response_size_bytes`
- **Type**: Histogram
- **Labels**: `method`, `route`, `protocol`
- **Description**: Response size in bytes

## Configuration

```typescript
interface PrometheusOptions {
  appName: string;
}
```

## Extending for New Protocols

To add support for a new protocol:

1. **Create a new factory**:
```typescript
export class WebSocketRequestMetricsFactory implements RequestMetricsFactory {
  createMetrics(context: ExecutionContext, startTime: number, endTime: number, data?: any): RequestMetrics {
    // Protocol-specific implementation
  }
}
```

2. **Register the factory**:
```typescript
// In MetricsFactoryRegistry
private static readonly factories = new Map<string, RequestMetricsFactory>([
  ['http', new HttpRequestMetricsFactory()],
  ['rpc', new GrpcRequestMetricsFactory()],
  ['websocket', new WebSocketRequestMetricsFactory()], // Add new protocol
]);
```

## Testing

The module includes comprehensive tests for all components:

```bash
# Run all Prometheus module tests
pnpm test libs/nest/modules/prometheus

# Run specific test files
pnpm test libs/nest/modules/prometheus/factories
pnpm test libs/nest/modules/prometheus/interfaces
```

## Error Handling

The module includes robust error handling:
- Graceful degradation when metrics collection fails
- Protocol detection fallbacks
- Safe handling of missing or malformed data

## Best Practices

1. **Always provide an app name** for proper metric labeling
2. **Monitor metric collection errors** in production logs
3. **Use consistent naming** for custom metrics
4. **Test with all supported protocols** in your application

## Examples

### HTTP Service Example

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    // This will automatically generate metrics with protocol='http'
    return { id, name: 'John Doe' };
  }
}
```

### gRPC Service Example

```typescript
@Controller()
export class UserServiceController {
  @GrpcMethod('UserService', 'GetUser')
  async getUser(data: { id: string }) {
    // This will automatically generate metrics with protocol='grpc'
    return { id: data.id, name: 'John Doe' };
  }
}
```

## Troubleshooting

### Common Issues

1. **"Cannot read properties of undefined (reading 'content-length')"**
   - This was fixed in the protocol-agnostic architecture
   - The module now properly handles different protocol contexts

2. **Metrics not appearing for gRPC requests**
   - Ensure the gRPC service is properly configured
   - Check that the MetricsInterceptor is registered globally

3. **Unknown protocol errors**
   - The module falls back to HTTP factory for unknown protocols
   - Add custom factory for new protocols if needed

### Debug Mode

Enable debug logging to troubleshoot metric collection:

```typescript
// In your application configuration
process.env.DEBUG = 'prometheus:*';
``` 