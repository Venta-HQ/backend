import { HealthChecker, HealthChecks } from '@app/utils';
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ServiceDiscoveryService } from '../services/service-discovery.service';

@Controller('health')
export class HealthController {
	private readonly healthChecker = new HealthChecker({ includeDetails: true });

	constructor(private readonly serviceDiscovery: ServiceDiscoveryService) {
		this.initializeHealthChecks();
	}

	/**
	 * Basic health check endpoint
	 */
	@Get()
	@HttpCode(HttpStatus.OK)
	async getHealth() {
		const status = await this.healthChecker.getHealthStatus();

		return {
			status: status.status,
			timestamp: status.timestamp,
			summary: status.summary,
		};
	}

	/**
	 * Detailed health check endpoint
	 */
	@Get('detailed')
	@HttpCode(HttpStatus.OK)
	async getDetailedHealth() {
		return await this.healthChecker.getHealthStatus();
	}

	/**
	 * Service discovery health check
	 */
	@Get('services')
	@HttpCode(HttpStatus.OK)
	async getServicesHealth() {
		const services = this.serviceDiscovery.getAllServices();
		const healthyServices = this.serviceDiscovery.getHealthyServices();
		const circuitBreakerStats = this.serviceDiscovery.getCircuitBreakerStats();

		return {
			services: {
				total: services.length,
				healthy: healthyServices.length,
				unhealthy: services.length - healthyServices.length,
			},
			serviceDetails: services,
			circuitBreakers: circuitBreakerStats,
		};
	}

	/**
	 * Circuit breaker statistics
	 */
	@Get('circuit-breakers')
	@HttpCode(HttpStatus.OK)
	async getCircuitBreakerStats() {
		return this.serviceDiscovery.getCircuitBreakerStats();
	}

	/**
	 * Reset circuit breakers (admin endpoint)
	 */
	@Get('reset-circuit-breakers')
	@HttpCode(HttpStatus.OK)
	async resetCircuitBreakers() {
		this.serviceDiscovery.resetCircuitBreakers();
		return { message: 'Circuit breakers reset successfully' };
	}

	/**
	 * Initialize health checks
	 */
	private initializeHealthChecks(): void {
		// Register basic system health checks
		this.healthChecker.register('memory', () => HealthChecks.memoryCheck(512));
		this.healthChecker.register('disk', () => HealthChecks.diskSpaceCheck());

		// Register service discovery health check
		this.healthChecker.register('service-discovery', async () => {
			const services = this.serviceDiscovery.getAllServices();
			const healthyServices = this.serviceDiscovery.getHealthyServices();

			if (services.length === 0) {
				return {
					name: 'service-discovery',
					status: 'degraded' as const,
					message: 'No services registered',
					timestamp: new Date(),
				};
			}

			const healthPercentage = (healthyServices.length / services.length) * 100;

			if (healthPercentage === 100) {
				return {
					name: 'service-discovery',
					status: 'healthy' as const,
					message: `All ${services.length} services are healthy`,
					timestamp: new Date(),
					details: {
						totalServices: services.length,
						healthyServices: healthyServices.length,
						healthPercentage,
					},
				};
			} else if (healthPercentage > 50) {
				return {
					name: 'service-discovery',
					status: 'degraded' as const,
					message: `${healthyServices.length}/${services.length} services are healthy`,
					timestamp: new Date(),
					details: {
						totalServices: services.length,
						healthyServices: healthyServices.length,
						healthPercentage,
					},
				};
			} else {
				return {
					name: 'service-discovery',
					status: 'unhealthy' as const,
					message: `Only ${healthyServices.length}/${services.length} services are healthy`,
					timestamp: new Date(),
					details: {
						totalServices: services.length,
						healthyServices: healthyServices.length,
						healthPercentage,
					},
				};
			}
		});
	}
}
