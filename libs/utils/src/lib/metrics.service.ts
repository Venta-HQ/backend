import { Counter, Gauge, Histogram, register } from 'prom-client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
	// Circuit breaker metrics
	private readonly circuitBreakerState = new Gauge({
		name: 'circuit_breaker_state',
		help: 'Current state of circuit breakers (0=closed, 1=half-open, 2=open)',
		labelNames: ['service_name'],
	});

	private readonly circuitBreakerFallbacks = new Counter({
		name: 'circuit_breaker_fallbacks_total',
		help: 'Total number of circuit breaker fallbacks',
		labelNames: ['service_name'],
	});

	// Request metrics
	private readonly requestDuration = new Histogram({
		name: 'http_request_duration_seconds',
		help: 'Duration of HTTP requests in seconds',
		labelNames: ['service_name', 'method', 'status_code'],
		buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
	});

	private readonly requestTotal = new Counter({
		name: 'http_requests_total',
		help: 'Total number of HTTP requests',
		labelNames: ['service_name', 'method', 'status_code'],
	});

	private readonly requestErrors = new Counter({
		name: 'http_request_errors_total',
		help: 'Total number of HTTP request errors',
		labelNames: ['service_name', 'error_type'],
	});

	// Service metrics
	private readonly serviceLatency = new Histogram({
		name: 'service_latency_seconds',
		help: 'Service call latency in seconds',
		labelNames: ['service_name', 'operation'],
		buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
	});

	private readonly serviceSuccess = new Counter({
		name: 'service_success_total',
		help: 'Total number of successful service calls',
		labelNames: ['service_name'],
	});

	private readonly serviceFailures = new Counter({
		name: 'service_failures_total',
		help: 'Total number of failed service calls',
		labelNames: ['service_name', 'error_type'],
	});

	private readonly serviceTimeouts = new Counter({
		name: 'service_timeouts_total',
		help: 'Total number of service timeouts',
		labelNames: ['service_name'],
	});

	private readonly serviceRejections = new Counter({
		name: 'service_rejections_total',
		help: 'Total number of service rejections',
		labelNames: ['service_name'],
	});

	// Active connections
	private readonly activeConnections = new Gauge({
		name: 'active_connections',
		help: 'Number of active connections',
		labelNames: ['service_name'],
	});

	// Memory usage
	private readonly memoryUsage = new Gauge({
		name: 'memory_usage_bytes',
		help: 'Memory usage in bytes',
		labelNames: ['type'],
	});

	constructor() {
		// Start memory monitoring
		this.startMemoryMonitoring();
	}

	/**
	 * Record circuit breaker state change
	 */
	recordCircuitBreakerState(serviceName: string, state: 'open' | 'half-open' | 'closed') {
		const stateValue = state === 'closed' ? 0 : state === 'half-open' ? 1 : 2;
		this.circuitBreakerState.set({ service_name: serviceName }, stateValue);
	}

	/**
	 * Record circuit breaker fallback
	 */
	recordCircuitBreakerFallback(serviceName: string) {
		this.circuitBreakerFallbacks.inc({ service_name: serviceName });
	}

	/**
	 * Record successful service call
	 */
	recordSuccess(serviceName: string, durationMs: number) {
		this.serviceSuccess.inc({ service_name: serviceName });
		this.serviceLatency.observe({ service_name: serviceName, operation: 'default' }, durationMs / 1000);
	}

	/**
	 * Record service failure
	 */
	recordFailure(serviceName: string, error: Error) {
		this.serviceFailures.inc({
			service_name: serviceName,
			error_type: error.constructor.name,
		});
	}

	/**
	 * Record service timeout
	 */
	recordTimeout(serviceName: string, durationMs: number) {
		this.serviceTimeouts.inc({ service_name: serviceName });
		this.serviceLatency.observe({ service_name: serviceName, operation: 'timeout' }, durationMs / 1000);
	}

	/**
	 * Record service rejection
	 */
	recordRejection(serviceName: string) {
		this.serviceRejections.inc({ service_name: serviceName });
	}

	/**
	 * Record HTTP request
	 */
	recordHttpRequest(serviceName: string, method: string, statusCode: number, durationMs: number) {
		this.requestTotal.inc({
			service_name: serviceName,
			method,
			status_code: statusCode.toString(),
		});

		this.requestDuration.observe(
			{ service_name: serviceName, method, status_code: statusCode.toString() },
			durationMs / 1000,
		);

		if (statusCode >= 400) {
			this.requestErrors.inc({
				service_name: serviceName,
				error_type: statusCode >= 500 ? 'server_error' : 'client_error',
			});
		}
	}

	/**
	 * Record active connections
	 */
	recordActiveConnections(serviceName: string, count: number) {
		this.activeConnections.set({ service_name: serviceName }, count);
	}

	/**
	 * Record memory usage
	 */
	recordMemoryUsage() {
		const memUsage = process.memoryUsage();

		this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
		this.memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
		this.memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
		this.memoryUsage.set({ type: 'external' }, memUsage.external);
	}

	/**
	 * Start memory monitoring
	 */
	private startMemoryMonitoring() {
		setInterval(() => {
			this.recordMemoryUsage();
		}, 30000); // Every 30 seconds
	}

	/**
	 * Get all metrics
	 */
	async getMetrics() {
		return await register.metrics();
	}

	/**
	 * Reset all metrics
	 */
	async resetMetrics() {
		return await register.clear();
	}
}
