import CircuitBreaker from 'opossum';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ServiceInfo {
	name: string;
	address: string;
	healthy: boolean;
	lastCheck: Date;
}

@Injectable()
export class ServiceDiscoveryService {
	private readonly logger = new Logger(ServiceDiscoveryService.name);
	private readonly services = new Map<string, ServiceInfo>();
	private readonly breakers = new Map<string, CircuitBreaker>();
	private readonly healthCheckInterval: number;
	private readonly healthCheckTimeout: number;

	constructor(private readonly configService: ConfigService) {
		this.healthCheckInterval = this.configService.get('HEALTH_CHECK_INTERVAL', 30000);
		this.healthCheckTimeout = this.configService.get('HEALTH_CHECK_TIMEOUT', 5000);
		this.initializeServices();
		this.startHealthChecks();
	}

	private initializeServices() {
		// Dynamic service discovery from environment variables
		const envVars = process.env;
		const serviceAddresses: Record<string, string> = {};

		// Look for SERVICE_*_ADDRESS pattern
		for (const [key, value] of Object.entries(envVars)) {
			if (key.startsWith('SERVICE_') && key.endsWith('_ADDRESS') && value) {
				const serviceName = key.replace('SERVICE_', '').replace('_ADDRESS', '').toLowerCase().replace(/_/g, '-');
				serviceAddresses[serviceName] = value;
			}
		}

		// Fallback to legacy pattern if no dynamic services found
		if (Object.keys(serviceAddresses).length === 0) {
			const legacyServices = {
				'user-service': this.configService.get('USER_SERVICE_ADDRESS'),
				'vendor-service': this.configService.get('VENDOR_SERVICE_ADDRESS'),
				'location-service': this.configService.get('LOCATION_SERVICE_ADDRESS'),
				'websocket-gateway': this.configService.get('WEBSOCKET_GATEWAY_SERVICE_ADDRESS'),
				'algolia-sync': this.configService.get('ALGOLIA_SYNC_SERVICE_ADDRESS'),
			};

			for (const [name, address] of Object.entries(legacyServices)) {
				if (address) {
					serviceAddresses[name] = address;
				}
			}
		}

		// Initialize service info
		for (const [name, address] of Object.entries(serviceAddresses)) {
			this.services.set(name, {
				name,
				address,
				healthy: true, // Assume healthy initially
				lastCheck: new Date(),
			});
		}

		this.logger.log(`Initialized ${this.services.size} services: ${Array.from(this.services.keys()).join(', ')}`);
	}

	private startHealthChecks() {
		setInterval(() => {
			this.performHealthChecks();
		}, this.healthCheckInterval);
	}

	private async performHealthChecks() {
		const healthCheckPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);

				const response = await fetch(`${service.address}/health`, {
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				const isHealthy = response.ok;
				this.services.set(name, {
					...service,
					healthy: isHealthy,
					lastCheck: new Date(),
				});

				if (!isHealthy) {
					this.logger.warn(`Service ${name} is unhealthy: ${response.status} ${response.statusText}`);
				}
			} catch (error) {
				this.services.set(name, {
					...service,
					healthy: false,
					lastCheck: new Date(),
				});

				this.logger.error(`Health check failed for ${name}:`, error);
			}
		});

		await Promise.allSettled(healthCheckPromises);
	}

	async executeRequest<T>(serviceName: string, operation: () => Promise<T>, options: any = {}): Promise<T> {
		const service = this.services.get(serviceName);
		if (!service) {
			throw new Error(`Service ${serviceName} not found`);
		}

		if (!service.healthy) {
			this.logger.warn(`Service ${serviceName} is unhealthy, attempting request anyway`);
		}

		// Use opossum directly
		let breaker = this.breakers.get(serviceName);

		if (!breaker) {
			breaker = new CircuitBreaker(operation, {
				timeout: options.timeout || 5000,
				errorThresholdPercentage: 50,
				resetTimeout: 30000,
				volumeThreshold: 10,
			});

			// Add event listeners for monitoring
			breaker.on('open', () => {
				this.logger.warn(`Circuit breaker opened for ${serviceName}`);
			});

			breaker.on('close', () => {
				this.logger.log(`Circuit breaker closed for ${serviceName}`);
			});

			breaker.on('halfOpen', () => {
				this.logger.log(`Circuit breaker half-open for ${serviceName}`);
			});

			breaker.on('fallback', (result: any) => {
				this.logger.warn(`Circuit breaker fallback triggered for ${serviceName}`);
			});

			breaker.on('success', (result: any, runTime: number) => {
				// Could integrate with metrics service here if needed
			});

			breaker.on('failure', (error: Error, runTime: number) => {
				this.logger.error(`Circuit breaker failure for ${serviceName}:`, error);
			});

			breaker.on('reject', (error: Error) => {
				this.logger.error(`Circuit breaker rejected for ${serviceName}:`, error);
			});

			this.breakers.set(serviceName, breaker);
		}

		return (await breaker.fire()) as T;
	}

	getAllServices(): ServiceInfo[] {
		return Array.from(this.services.values());
	}

	getHealthyServices(): ServiceInfo[] {
		return Array.from(this.services.values()).filter((service) => service.healthy);
	}

	getServiceInfo(serviceName: string): ServiceInfo | undefined {
		return this.services.get(serviceName);
	}

	getCircuitBreakerStats() {
		const stats: Record<string, any> = {};

		for (const [serviceName, breaker] of this.breakers) {
			stats[serviceName] = {
				state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
				stats: breaker.stats,
			};
		}

		return stats;
	}
}
