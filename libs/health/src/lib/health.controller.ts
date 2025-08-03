import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import {
	DiskHealthIndicator,
	HealthCheck,
	HealthCheckService,
	MemoryHealthIndicator,
	MicroserviceHealthIndicator,
} from '@nestjs/terminus';

export interface HealthControllerOptions {
	serviceName: string;
	additionalChecks?: () => Promise<Record<string, any>>;
}

@Controller('health')
export class HealthController {
	private readonly serviceName: string;
	private readonly additionalChecks?: () => Promise<Record<string, any>>;

	constructor(
		private health: HealthCheckService,
		private memory: MemoryHealthIndicator,
		private disk: DiskHealthIndicator,
		private microservice: MicroserviceHealthIndicator,
		@Inject('HEALTH_OPTIONS') options: HealthControllerOptions,
	) {
		this.serviceName = options.serviceName;
		this.additionalChecks = options.additionalChecks;
	}

	/**
	 * Basic health check endpoint
	 */
	@Get()
	@HealthCheck()
	@HttpCode(HttpStatus.OK)
	async getHealth() {
		const healthChecks = [
			() => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
			() => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
			() => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
		];

		return this.health.check(healthChecks);
	}

	/**
	 * Detailed health check endpoint
	 */
	@Get('detailed')
	@HealthCheck()
	@HttpCode(HttpStatus.OK)
	async getDetailedHealth() {
		const healthChecks = [
			() => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
			() => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),
			() => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
			() => this.microservice.pingCheck('database', { transport: 5432, timeout: 5000 }),
			() => this.microservice.pingCheck('redis', { transport: 6379, timeout: 5000 }),
			() => this.microservice.pingCheck('nats', { transport: 4222, timeout: 5000 }),
		];

		const healthResult = await this.health.check(healthChecks);

		// Add custom checks if provided
		let customData = {};
		if (this.additionalChecks) {
			try {
				customData = await this.additionalChecks();
			} catch (error) {
				customData = {
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		}

		return {
			...healthResult,
			service: this.serviceName,
			uptime: process.uptime(),
			version: process.env['npm_package_version'] || 'unknown',
			...customData,
		};
	}
}
