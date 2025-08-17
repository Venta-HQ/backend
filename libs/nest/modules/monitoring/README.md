# Monitoring Modules

Collection of observability and monitoring modules for the Venta backend.

## Modules

### 🔎 [TracingModule](./tracing/README.md)

OpenTelemetry distributed tracing with automatic instrumentation.

**Features:**

- Request correlation via `requestId`
- SQL query visibility
- Cross-service context propagation
- Tempo integration

### 📊 [PrometheusModule](./prometheus/README.md)

Metrics collection and Prometheus integration.

**Features:**

- Custom business metrics
- HTTP/gRPC metrics
- Performance monitoring
- Grafana dashboards

### 🏥 [HealthModule](./health/README.md)

Health check endpoints and monitoring.

**Features:**

- Readiness and liveness probes
- Custom health checks
- Dependency monitoring
- Kubernetes integration

## Complete Documentation

For comprehensive guides on the full observability stack:

- 📖 **[Distributed Tracing Guide](../../../docs/tracing-guide.md)** - Complete OpenTelemetry setup and usage
- 📊 **[Monitoring Guide](../../../docs/monitoring-guide.md)** - Overall observability strategy
- 🏗️ **[Architecture Guide](../../../docs/architecture-guide.md)** - System architecture and patterns

## Quick Start

All monitoring modules are automatically included when using `BootstrapModule`:

```typescript
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.API_GATEWAY,
			domain: 'infrastructure',
			protocol: 'http',
		}),
		// Your application modules...
	],
})
export class AppModule {}
```

This automatically provides:

- ✅ **Distributed tracing** with OpenTelemetry
- ✅ **Metrics collection** with Prometheus
- ✅ **Health checks** with readiness/liveness endpoints
- ✅ **Request correlation** across all operations
