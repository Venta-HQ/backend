# TracingModule

OpenTelemetry distributed tracing module for the Venta backend.

## Usage

The `TracingModule` is automatically included in `BootstrapModule` and requires no additional configuration in most cases.

```typescript
// Automatically included - no manual setup needed
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.API_GATEWAY,
			domain: 'infrastructure',
			protocol: 'http',
		}),
	],
})
export class AppModule {}
```

## Features

- **Automatic instrumentation** for HTTP, gRPC, Prisma, Redis, Socket.IO, NATS, and external calls
- **Request correlation** via `requestId` propagation
- **SQL query capture** with raw SQL in span events
- **Context propagation** across service boundaries
- **Tempo integration** for trace storage and querying

## Configuration

| Environment Variable                 | Default                           | Description              |
| ------------------------------------ | --------------------------------- | ------------------------ |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | `http://localhost:4318/v1/traces` | Tempo OTLP endpoint      |
| `APP_NAME`                           | Set by BootstrapModule            | Service name for tracing |
| `DOMAIN`                             | Set by BootstrapModule            | Service namespace        |
| `NODE_ENV`                           | -                                 | Deployment environment   |

## Documentation

For complete usage guide, search examples, and troubleshooting, see:

📖 **[Distributed Tracing Guide](../../../../docs/tracing-guide.md)**

## Quick Search Examples

```traceql
# Find traces by request ID
{ span.request.id = "req-abc-123" }

# Find slow database queries
{ span.db.duration.ms > 100 }

# Find service errors
{ resource.service.name = "api-gateway" && span.status = error }
```
