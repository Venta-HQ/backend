import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
	DiskHealthIndicator,
	HealthCheck,
	HealthCheckService,
	HttpHealthIndicator,
	MemoryHealthIndicator,
	MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { CircuitBreakerService } from './circuit-breaker.service';
import { CircuitState } from './circuit-breaker.util';
import { MetricsService } from './metrics.service';

@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
		private microservice: MicroserviceHealthIndicator,
		private memory: MemoryHealthIndicator,
		private disk: DiskHealthIndicator,
		private circuitBreakerService: CircuitBreakerService,
		private metricsService: MetricsService,
	) {}

	@Get()
	@HealthCheck()
	@HttpCode(HttpStatus.OK)
	async check() {
		return this.health.check([
			// Basic health checks
			() => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
			() => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
			() => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }), // 90% threshold
		]);
	}

	@Get('detailed')
	@HealthCheck()
	@HttpCode(HttpStatus.OK)
	async detailedCheck() {
		return this.health.check([
			// Memory checks
			() => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
			() => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

			// Disk checks
			() => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),

			// Database checks (if available)
			() => this.microservice.pingCheck('database', { transport: 5432, timeout: 5000 }),

			// Redis checks (if available)
			() => this.microservice.pingCheck('redis', { transport: 6379, timeout: 5000 }),

			// External service checks
			() => this.http.pingCheck('nestjs-docs', 'https://docs.nestjs.com'),
		]);
	}

	@Get('services')
	@HttpCode(HttpStatus.OK)
	async serviceHealth() {
		const serviceChecks = [
			// Check each service endpoint
			() => this.http.pingCheck('user-service', 'http://localhost:3001/health'),
			() => this.http.pingCheck('vendor-service', 'http://localhost:3002/health'),
			() => this.http.pingCheck('location-service', 'http://localhost:3003/health'),
			() => this.http.pingCheck('websocket-gateway', 'http://localhost:3004/health'),
			() => this.http.pingCheck('algolia-sync', 'http://localhost:3005/health'),
		];

		return this.health.check(serviceChecks);
	}

	@Get('circuit-breakers')
	@HttpCode(HttpStatus.OK)
	async circuitBreakerHealth() {
		const stats = this.circuitBreakerService.getAllStats();

		const circuitBreakerChecks = Object.entries(stats).map(([serviceName, stats]) => {
			const isHealthy = stats?.state === CircuitState.CLOSED || stats?.state === CircuitState.HALF_OPEN;

			return {
				service: serviceName,
				state: stats?.state || 'unknown',
				healthy: isHealthy,
				stats: stats || {},
			};
		});

		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			circuitBreakers: circuitBreakerChecks,
		};
	}

	@Get('metrics')
	@HttpCode(HttpStatus.OK)
	async getMetrics() {
		const metrics = await this.metricsService.getMetrics();

		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			metrics: metrics,
		};
	}

	@Get('reset-circuit-breakers')
	@HttpCode(HttpStatus.OK)
	async resetCircuitBreakers() {
		this.circuitBreakerService.resetAll();

		return {
			status: 'ok',
			message: 'All circuit breakers have been reset',
			timestamp: new Date().toISOString(),
		};
	}

	@Get('reset-metrics')
	@HttpCode(HttpStatus.OK)
	async resetMetrics() {
		await this.metricsService.resetMetrics();

		return {
			status: 'ok',
			message: 'All metrics have been reset',
			timestamp: new Date().toISOString(),
		};
	}
}
