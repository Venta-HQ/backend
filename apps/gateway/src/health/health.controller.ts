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
	 * Basic health check
	 */
	@Get()
	@HttpCode(HttpStatus.OK)
	async getHealth() {
		return this.healthChecker.getHealthStatus();
	}

	/**
	 * Detailed health check with all services
	 */
	@Get('detailed')
	@HttpCode(HttpStatus.OK)
	async getDetailedHealth() {
		const basicHealth = await this.healthChecker.getHealthStatus();
		const servicesHealth = await this.getServicesHealth();

		return {
			...basicHealth,
			services: servicesHealth,
		};
	}

	/**
	 * Services health check
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
