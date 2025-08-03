import { CircuitBreakerManager, CircuitBreakerOptions } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ServiceEndpoint {
	name: string;
	url: string;
	health: 'healthy' | 'unhealthy' | 'unknown';
	lastChecked: Date;
	responseTime?: number;
}

export interface ServiceDiscoveryOptions {
	/** How often to check service health in milliseconds */
	healthCheckInterval?: number;
	/** Timeout for health checks in milliseconds */
	healthCheckTimeout?: number;
	/** Circuit breaker options for each service */
	circuitBreakerOptions?: CircuitBreakerOptions;
}

@Injectable()
export class ServiceDiscoveryService {
	private readonly logger = new Logger(ServiceDiscoveryService.name);
	private readonly services = new Map<string, ServiceEndpoint>();
	private readonly circuitBreakerManager = new CircuitBreakerManager();
	private healthCheckInterval?: NodeJS.Timeout;

	constructor(
		private readonly configService: ConfigService,
		private readonly options: ServiceDiscoveryOptions = {},
	) {
		this.initializeServices();
		this.startHealthChecks();
	}

	/**
	 * Get a service endpoint by name
	 * @param serviceName Name of the service
	 * @returns Service endpoint or null if not found
	 */
	getService(serviceName: string): ServiceEndpoint | null {
		return this.services.get(serviceName) || null;
	}

	/**
	 * Get all registered services
	 * @returns Array of all service endpoints
	 */
	getAllServices(): ServiceEndpoint[] {
		return Array.from(this.services.values());
	}

	/**
	 * Get healthy services only
	 * @returns Array of healthy service endpoints
	 */
	getHealthyServices(): ServiceEndpoint[] {
		return this.getAllServices().filter((service) => service.health === 'healthy');
	}

	/**
	 * Register a new service
	 * @param name Service name
	 * @param url Service URL
	 */
	registerService(name: string, url: string): void {
		this.services.set(name, {
			name,
			url,
			health: 'unknown',
			lastChecked: new Date(),
		});

		// Create circuit breaker for this service
		const circuitBreakerOptions = this.options.circuitBreakerOptions || {
			failureThreshold: 3,
			recoveryTimeout: 30000,
			timeout: 5000,
			monitoring: true,
		};

		this.circuitBreakerManager.getCircuitBreaker(name, circuitBreakerOptions, this.logger);

		this.logger.log(`Registered service: ${name} at ${url}`);
	}

	/**
	 * Unregister a service
	 * @param name Service name
	 */
	unregisterService(name: string): void {
		this.services.delete(name);
		this.logger.log(`Unregistered service: ${name}`);
	}

	/**
	 * Execute a request to a service with circuit breaker protection
	 * @param serviceName Name of the service
	 * @param requestFunction Function that makes the request
	 * @returns Promise with the result
	 */
	async executeRequest<T>(serviceName: string, requestFunction: () => Promise<T>): Promise<T> {
		const service = this.getService(serviceName);
		if (!service) {
			throw new Error(`Service '${serviceName}' not found`);
		}

		if (service.health === 'unhealthy') {
			throw new Error(`Service '${serviceName}' is unhealthy`);
		}

		const circuitBreaker = this.circuitBreakerManager.getCircuitBreaker(
			serviceName,
			this.options.circuitBreakerOptions || {
				failureThreshold: 3,
				recoveryTimeout: 30000,
				timeout: 5000,
				monitoring: true,
			},
			this.logger,
		);

		return circuitBreaker.execute(requestFunction);
	}

	/**
	 * Get circuit breaker statistics for all services
	 */
	getCircuitBreakerStats() {
		return this.circuitBreakerManager.getAllStats();
	}

	/**
	 * Reset all circuit breakers
	 */
	resetCircuitBreakers(): void {
		this.circuitBreakerManager.resetAll();
		this.logger.log('Reset all circuit breakers');
	}

	/**
	 * Initialize services from configuration
	 */
	private initializeServices(): void {
		// Method 1: Dynamic discovery from environment variables
		this.initializeServicesFromEnv();
	}

	/**
	 * Initialize services dynamically from environment variables
	 * Looks for patterns like SERVICE_*_ADDRESS
	 */
	private initializeServicesFromEnv(): void {
		// Get all environment variables that match SERVICE_*_ADDRESS pattern
		const envVars = Object.keys(process.env);
		const serviceAddressVars = envVars.filter((key) => key.startsWith('SERVICE_') && key.endsWith('_ADDRESS'));

		// Process each service address variable
		for (const envVar of serviceAddressVars) {
			const serviceName = this.extractServiceNameFromEnvVar(envVar);
			const serviceUrl = this.configService.get<string>(envVar);

			if (serviceUrl) {
				this.registerService(serviceName, serviceUrl);
				this.logger.log(`Dynamically registered service: ${serviceName} at ${serviceUrl}`);
			}
		}

		// Fallback to hardcoded services if no dynamic services found
		if (serviceAddressVars.length === 0) {
			this.initializeHardcodedServices();
		}
	}

	/**
	 * Extract service name from environment variable
	 * SERVICE_USER_SERVICE_ADDRESS -> user-service
	 */
	private extractServiceNameFromEnvVar(envVar: string): string {
		// Remove SERVICE_ prefix and _ADDRESS suffix
		const servicePart = envVar.replace('SERVICE_', '').replace('_ADDRESS', '');

		// Convert to kebab-case
		return servicePart.toLowerCase().replace(/_/g, '-');
	}

	/**
	 * Initialize hardcoded services (fallback method)
	 */
	private initializeHardcodedServices(): void {
		// Register services from environment variables with fallback defaults
		const serviceConfigs = [
			{ name: 'user-service', envVar: 'USER_SERVICE_ADDRESS', defaultUrl: 'http://localhost:3001' },
			{ name: 'vendor-service', envVar: 'VENDOR_SERVICE_ADDRESS', defaultUrl: 'http://localhost:3002' },
			{ name: 'location-service', envVar: 'LOCATION_SERVICE_ADDRESS', defaultUrl: 'http://localhost:3003' },
			{
				name: 'websocket-gateway-service',
				envVar: 'WEBSOCKET_GATEWAY_SERVICE_ADDRESS',
				defaultUrl: 'http://localhost:3004',
			},
			{ name: 'algolia-sync-service', envVar: 'ALGOLIA_SYNC_SERVICE_ADDRESS', defaultUrl: 'http://localhost:3005' },
		];

		for (const config of serviceConfigs) {
			const url = this.configService.get<string>(config.envVar) || config.defaultUrl;
			if (url) {
				this.registerService(config.name, url);
				this.logger.log(`Registered service: ${config.name} at ${url}`);
			} else {
				this.logger.warn(`Service URL not found for ${config.name} (${config.envVar})`);
			}
		}
	}

	/**
	 * Start periodic health checks
	 */
	private startHealthChecks(): void {
		const interval = this.options.healthCheckInterval || 30000; // 30 seconds

		this.healthCheckInterval = setInterval(async () => {
			await this.performHealthChecks();
		}, interval);

		this.logger.log(`Started health checks every ${interval}ms`);
	}

	/**
	 * Perform health checks for all services
	 */
	private async performHealthChecks(): Promise<void> {
		const promises = Array.from(this.services.keys()).map((serviceName) => this.checkServiceHealth(serviceName));

		await Promise.allSettled(promises);
	}

	/**
	 * Check health of a specific service
	 * @param serviceName Name of the service to check
	 */
	private async checkServiceHealth(serviceName: string): Promise<void> {
		const service = this.services.get(serviceName);
		if (!service) return;

		const startTime = Date.now();
		let health: 'healthy' | 'unhealthy' = 'unhealthy';

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.options.healthCheckTimeout || 5000);

			const response = await fetch(`${service.url}/health`, {
				method: 'GET',
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			health = response.ok ? 'healthy' : 'unhealthy';
		} catch (error) {
			health = 'unhealthy';
			this.logger.debug(`Health check failed for ${serviceName}: ${error}`);
		}

		const responseTime = Date.now() - startTime;

		// Update service health
		this.services.set(serviceName, {
			...service,
			health,
			lastChecked: new Date(),
			responseTime,
		});

		if (health === 'unhealthy') {
			this.logger.warn(`Service ${serviceName} is unhealthy (response time: ${responseTime}ms)`);
		} else {
			this.logger.debug(`Service ${serviceName} is healthy (response time: ${responseTime}ms)`);
		}
	}

	/**
	 * Stop health checks
	 */
	onModuleDestroy(): void {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.logger.log('Stopped health checks');
		}
	}
}
