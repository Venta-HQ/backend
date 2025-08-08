# 📊 Monitoring & Observability Guide

## Overview

This guide outlines the monitoring and observability practices for the Venta backend. We use a comprehensive approach combining metrics, logging, and tracing to ensure system health and performance.

## 📋 Table of Contents

1. [Monitoring Strategy](#monitoring-strategy)
2. [Metrics Collection](#metrics-collection)
3. [Logging](#logging)
4. [Request Tracing](#request-tracing)
5. [Alerting](#alerting)
6. [Dashboards](#dashboards)

## Monitoring Strategy

### Components

1. **Metrics**

   - Prometheus for collection
   - Grafana for visualization
   - Custom domain metrics

2. **Logging**

   - Structured JSON logging
   - Correlation IDs
   - Log aggregation

3. **Tracing**
   - Request tracking
   - Cross-service correlation
   - Performance monitoring

### Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Services   │───▶│   Metrics    │───▶│   Grafana    │
└──────────────┘    │  (Prometheus)│    └──────────────┘
       │            └──────────────┘           ▲
       │                                       │
       ▼            ┌──────────────┐          │
┌──────────────┐    │    Logs     │          │
│   Logging    │───▶│             │──────────┘
└──────────────┘    └──────────────┘
```

## Metrics Collection

### Service Metrics

Service metrics are collected with request context for better traceability. See the [Request Context Guide](./request-context-guide.md) for details about context propagation.

```typescript
// Service with metrics and context
@Injectable()
export class VendorService {
	constructor(
		private readonly metricsService: MetricsService,
		private readonly contextService: RequestContextService,
	) {}

	async updateLocation(vendorId: string, location: LocationData) {
		const startTime = Date.now();
		const context = this.contextService.getContext();

		try {
			await this.processLocationUpdate(vendorId, location);

			this.metricsService.recordSuccess('vendor.location.update', {
				duration: Date.now() - startTime,
				requestId: context?.requestId,
				correlationId: context?.correlationId,
				domain: context?.domain,
			});
		} catch (error) {
			this.metricsService.recordError('vendor.location.update', {
				duration: Date.now() - startTime,
				error: error.message,
				requestId: context?.requestId,
				correlationId: context?.correlationId,
				domain: context?.domain,
			});
			throw error;
		}
	}
}
```

### Domain Metrics

```typescript
// Domain-specific metrics
@Injectable()
export class MarketplaceMetrics {
	private readonly vendorGauge: Gauge;
	private readonly locationHistogram: Histogram;

	constructor() {
		this.vendorGauge = new Gauge({
			name: 'marketplace_active_vendors',
			help: 'Number of currently active vendors',
			labelNames: ['status'],
		});

		this.locationHistogram = new Histogram({
			name: 'marketplace_location_updates',
			help: 'Location update latency',
			buckets: [0.1, 0.5, 1, 2, 5],
		});
	}

	recordActiveVendors(count: number, status: string) {
		this.vendorGauge.set({ status }, count);
	}

	recordLocationUpdate(duration: number) {
		this.locationHistogram.observe(duration);
	}
}
```

### Custom Metrics

```typescript
// Custom business metrics
@Injectable()
export class BusinessMetrics {
	private readonly revenueGauge: Gauge;
	private readonly userCounter: Counter;

	constructor() {
		this.revenueGauge = new Gauge({
			name: 'business_revenue_total',
			help: 'Total revenue',
			labelNames: ['type'],
		});

		this.userCounter = new Counter({
			name: 'business_user_actions',
			help: 'User actions count',
			labelNames: ['action'],
		});
	}

	recordRevenue(amount: number, type: string) {
		this.revenueGauge.inc({ type }, amount);
	}

	recordUserAction(action: string) {
		this.userCounter.inc({ action });
	}
}
```

## Logging

### Structured Logging

```typescript
// Structured logger configuration
@Injectable()
export class AppLogger implements LoggerService {
	private logger: Logger;

	constructor(@Inject(REQUEST) private request: Request) {
		this.logger = new Logger({
			format: format.combine(format.timestamp(), format.json()),
		});
	}

	log(message: string, context: any = {}) {
		this.logger.info(message, {
			...this.getRequestContext(),
			...context,
		});
	}

	error(message: string, trace?: string, context: any = {}) {
		this.logger.error(message, {
			...this.getRequestContext(),
			trace,
			...context,
		});
	}

	private getRequestContext() {
		return {
			requestId: this.request?.id,
			userId: this.request?.user?.id,
			path: this.request?.path,
		};
	}
}
```

### Domain Logging

```typescript
// Domain-specific logging
@Injectable()
export class VendorLogger {
	constructor(private readonly logger: AppLogger) {}

	logLocationUpdate(vendorId: string, location: LocationData) {
		this.logger.log('Vendor location updated', {
			domain: 'marketplace',
			operation: 'location_update',
			vendorId,
			location,
		});
	}

	logStatusChange(vendorId: string, status: string) {
		this.logger.log('Vendor status changed', {
			domain: 'marketplace',
			operation: 'status_change',
			vendorId,
			status,
		});
	}
}
```

### Error Logging

```typescript
// Error logging with context
@Catch(AppError)
export class AppExceptionFilter implements ExceptionFilter {
	constructor(private readonly logger: AppLogger) {}

	catch(error: AppError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();

		this.logger.error('Application error', {
			type: error.type,
			code: error.code,
			message: error.message,
			stack: error.stack,
			context: error.context,
			request: {
				id: request.id,
				path: request.path,
				method: request.method,
			},
		});

		response.status(this.getHttpStatus(error.type)).json({
			type: error.type,
			code: error.code,
			message: error.message,
		});
	}
}
```

## Request Tracing

For detailed information about request context and tracing, see the [Request Context Guide](./request-context-guide.md).

The monitoring system integrates with request context to provide:

- Request correlation in metrics
- Trace ID in logs
- Context in alerts
- End-to-end request visibility

## Alerting

### Alert Rules

```yaml
# Prometheus alert rules
groups:
  - name: vendor_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          description: Error rate is above 10% for 5 minutes

      - alert: VendorLocationUpdateDelay
        expr: vendor_location_update_duration_seconds > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: Vendor location updates are delayed
          description: Location updates taking longer than 5 seconds

      - alert: LowActiveVendors
        expr: marketplace_active_vendors < 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: Low number of active vendors
          description: Less than 10 active vendors for 10 minutes
```

### Alert Handlers

```typescript
// Alert handling service
@Injectable()
export class AlertService {
	constructor(
		private readonly notificationService: NotificationService,
		private readonly logger: AppLogger,
	) {}

	async handleAlert(alert: Alert) {
		this.logger.log('Alert received', {
			alertName: alert.name,
			severity: alert.severity,
			value: alert.value,
		});

		switch (alert.severity) {
			case 'critical':
				await this.handleCriticalAlert(alert);
				break;
			case 'warning':
				await this.handleWarningAlert(alert);
				break;
			default:
				await this.handleInfoAlert(alert);
		}
	}

	private async handleCriticalAlert(alert: Alert) {
		await this.notificationService.notifyTeam(alert);
		await this.notificationService.createIncident(alert);
	}

	private async handleWarningAlert(alert: Alert) {
		await this.notificationService.notifyTeam(alert);
	}

	private async handleInfoAlert(alert: Alert) {
		await this.notificationService.logAlert(alert);
	}
}
```

## Dashboards

### System Dashboard

```typescript
// Dashboard configuration
export const systemDashboard = {
	title: 'System Overview',
	refresh: '10s',
	panels: [
		{
			title: 'Request Rate',
			type: 'graph',
			datasource: 'Prometheus',
			targets: [
				{
					expr: 'sum(rate(http_requests_total[5m])) by (status)',
					legendFormat: '{{status}}',
				},
			],
		},
		{
			title: 'Error Rate',
			type: 'graph',
			datasource: 'Prometheus',
			targets: [
				{
					expr: 'sum(rate(http_requests_total{status=~"5.."}[5m]))',
					legendFormat: 'errors',
				},
			],
		},
		{
			title: 'Response Time',
			type: 'graph',
			datasource: 'Prometheus',
			targets: [
				{
					expr: 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
					legendFormat: '95th percentile',
				},
			],
		},
	],
};
```

### Business Dashboard

```typescript
// Business metrics dashboard
export const businessDashboard = {
	title: 'Business Metrics',
	refresh: '1m',
	panels: [
		{
			title: 'Active Vendors',
			type: 'gauge',
			datasource: 'Prometheus',
			targets: [
				{
					expr: 'sum(marketplace_active_vendors)',
					legendFormat: 'vendors',
				},
			],
		},
		{
			title: 'Location Updates',
			type: 'graph',
			datasource: 'Prometheus',
			targets: [
				{
					expr: 'rate(marketplace_location_updates_total[5m])',
					legendFormat: 'updates/sec',
				},
			],
		},
		{
			title: 'Revenue',
			type: 'graph',
			datasource: 'Prometheus',
			targets: [
				{
					expr: 'sum(business_revenue_total) by (type)',
					legendFormat: '{{type}}',
				},
			],
		},
	],
};
```

## Best Practices

### Metrics

1. **Naming**

   - Use consistent naming patterns
   - Include domain/service prefix
   - Use clear metric types

2. **Labels**

   - Keep cardinality low
   - Use meaningful labels
   - Follow naming conventions

3. **Types**
   - Counter: Increasing values
   - Gauge: Current values
   - Histogram: Distributions
   - Summary: Percentiles

### Logging

1. **Structure**

   - Use JSON format
   - Include context
   - Add correlation IDs

2. **Levels**

   - ERROR: Errors
   - WARN: Warnings
   - INFO: Normal events
   - DEBUG: Debug info

3. **Content**
   - No sensitive data
   - Meaningful messages
   - Relevant context

### Tracing

1. **Context**

   - Propagate trace IDs
   - Add span context
   - Include user context

2. **Sampling**

   - Use adaptive sampling
   - Focus on errors
   - Sample by feature

3. **Performance**
   - Minimize overhead
   - Batch operations
   - Use async processing

## Additional Resources

- [Architecture Guide](./architecture-guide.md)
- [Developer Guide](./developer-guide.md)
- [API Documentation](./api-docs.md)
- [Testing Guide](./testing-guide.md)
