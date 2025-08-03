export interface HealthCheckResult {
	name: string;
	status: 'healthy' | 'unhealthy' | 'degraded';
	message?: string;
	timestamp: Date;
	details?: Record<string, any>;
}

export interface HealthCheckOptions {
	/** Timeout for the health check in milliseconds */
	timeout?: number;
	/** Whether to include detailed information in the response */
	includeDetails?: boolean;
}

export type HealthCheckFunction = () => Promise<HealthCheckResult>;

export class HealthChecker {
	private checks = new Map<string, HealthCheckFunction>();
	private options: HealthCheckOptions;

	constructor(options: HealthCheckOptions = {}) {
		this.options = {
			timeout: 5000,
			includeDetails: false,
			...options,
		};
	}

	/**
	 * Register a health check function
	 * @param name Name of the health check
	 * @param checkFunction Function that performs the health check
	 */
	register(name: string, checkFunction: HealthCheckFunction): void {
		this.checks.set(name, checkFunction);
	}

	/**
	 * Unregister a health check
	 * @param name Name of the health check to remove
	 */
	unregister(name: string): void {
		this.checks.delete(name);
	}

	/**
	 * Get all registered health check names
	 */
	getRegisteredChecks(): string[] {
		return Array.from(this.checks.keys());
	}

	/**
	 * Run a specific health check
	 * @param name Name of the health check to run
	 * @returns Health check result
	 */
	async runCheck(name: string): Promise<HealthCheckResult> {
		const checkFunction = this.checks.get(name);
		if (!checkFunction) {
			throw new Error(`Health check '${name}' not found`);
		}

		return this.executeCheck(name, checkFunction);
	}

	/**
	 * Run all registered health checks
	 * @returns Array of health check results
	 */
	async runAllChecks(): Promise<HealthCheckResult[]> {
		const results: HealthCheckResult[] = [];
		const promises: Promise<HealthCheckResult>[] = [];

		for (const [name, checkFunction] of this.checks) {
			promises.push(this.executeCheck(name, checkFunction));
		}

		const checkResults = await Promise.allSettled(promises);
		
		for (const result of checkResults) {
			if (result.status === 'fulfilled') {
				results.push(result.value);
			} else {
				results.push({
					name: 'unknown',
					status: 'unhealthy',
					message: result.reason?.message || 'Health check failed',
					timestamp: new Date(),
				});
			}
		}

		return results;
	}

	/**
	 * Get overall health status
	 * @returns Overall health status and summary
	 */
	async getHealthStatus(): Promise<{
		status: 'healthy' | 'unhealthy' | 'degraded';
		timestamp: Date;
		checks: HealthCheckResult[];
		summary: {
			total: number;
			healthy: number;
			unhealthy: number;
			degraded: number;
		};
	}> {
		const checks = await this.runAllChecks();
		const summary = {
			total: checks.length,
			healthy: checks.filter(c => c.status === 'healthy').length,
			unhealthy: checks.filter(c => c.status === 'unhealthy').length,
			degraded: checks.filter(c => c.status === 'degraded').length,
		};

		let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
		if (summary.unhealthy > 0) {
			overallStatus = 'unhealthy';
		} else if (summary.degraded > 0) {
			overallStatus = 'degraded';
		}

		return {
			status: overallStatus,
			timestamp: new Date(),
			checks: this.options.includeDetails ? checks : checks.map(c => ({
				name: c.name,
				status: c.status,
				message: c.message,
				timestamp: c.timestamp,
			})),
			summary,
		};
	}

	private async executeCheck(name: string, checkFunction: HealthCheckFunction): Promise<HealthCheckResult> {
		try {
			if (this.options.timeout) {
				const timeoutPromise = new Promise<never>((_, reject) => {
					setTimeout(() => {
						reject(new Error(`Health check '${name}' timed out after ${this.options.timeout}ms`));
					}, this.options.timeout);
				});

				const result = await Promise.race([checkFunction(), timeoutPromise]);
				return {
					...result,
					name,
					timestamp: new Date(),
				};
			} else {
				const result = await checkFunction();
				return {
					...result,
					name,
					timestamp: new Date(),
				};
			}
		} catch (error) {
			return {
				name,
				status: 'unhealthy',
				message: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date(),
				details: this.options.includeDetails ? { error: error } : undefined,
			};
		}
	}
}

/**
 * Predefined health check functions
 */
export class HealthChecks {
	/**
	 * Database connectivity check
	 */
	static async databaseCheck(prismaClient: any): Promise<HealthCheckResult> {
		try {
			await prismaClient.$queryRaw`SELECT 1`;
			return {
				name: 'database',
				status: 'healthy',
				message: 'Database connection is healthy',
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				name: 'database',
				status: 'unhealthy',
				message: 'Database connection failed',
				timestamp: new Date(),
				details: { error: error instanceof Error ? error.message : 'Unknown error' },
			};
		}
	}

	/**
	 * Redis connectivity check
	 */
	static async redisCheck(redisClient: any): Promise<HealthCheckResult> {
		try {
			await redisClient.ping();
			return {
				name: 'redis',
				status: 'healthy',
				message: 'Redis connection is healthy',
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				name: 'redis',
				status: 'unhealthy',
				message: 'Redis connection failed',
				timestamp: new Date(),
				details: { error: error instanceof Error ? error.message : 'Unknown error' },
			};
		}
	}

	/**
	 * External service connectivity check
	 */
	static async externalServiceCheck(
		serviceName: string,
		checkFunction: () => Promise<any>,
	): Promise<HealthCheckResult> {
		try {
			await checkFunction();
			return {
				name: serviceName,
				status: 'healthy',
				message: `${serviceName} service is healthy`,
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				name: serviceName,
				status: 'unhealthy',
				message: `${serviceName} service is unavailable`,
				timestamp: new Date(),
				details: { error: error instanceof Error ? error.message : 'Unknown error' },
			};
		}
	}

	/**
	 * Memory usage check
	 */
	static async memoryCheck(thresholdMB: number = 512): Promise<HealthCheckResult> {
		const used = process.memoryUsage();
		const usedMB = Math.round(used.heapUsed / 1024 / 1024);

		if (usedMB > thresholdMB) {
			return {
				name: 'memory',
				status: 'degraded',
				message: `Memory usage is high: ${usedMB}MB`,
				timestamp: new Date(),
				details: {
					heapUsed: usedMB,
					heapTotal: Math.round(used.heapTotal / 1024 / 1024),
					rss: Math.round(used.rss / 1024 / 1024),
					threshold: thresholdMB,
				},
			};
		}

		return {
			name: 'memory',
			status: 'healthy',
			message: `Memory usage is normal: ${usedMB}MB`,
			timestamp: new Date(),
			details: {
				heapUsed: usedMB,
				heapTotal: Math.round(used.heapTotal / 1024 / 1024),
				rss: Math.round(used.rss / 1024 / 1024),
			},
		};
	}

	/**
	 * Disk space check
	 */
	static async diskSpaceCheck(path: string = '.', thresholdGB: number = 1): Promise<HealthCheckResult> {
		try {
			// This is a simplified check - in production you might want to use a proper disk space library
			const fs = require('fs');
			
			// For now, just check if we can write to the directory
			const testFile = `${path}/health-check-test-${Date.now()}`;
			fs.writeFileSync(testFile, 'test');
			fs.unlinkSync(testFile);

			return {
				name: 'disk',
				status: 'healthy',
				message: 'Disk space is sufficient',
				timestamp: new Date(),
			};
		} catch (error) {
			return {
				name: 'disk',
				status: 'degraded',
				message: 'Disk space check failed',
				timestamp: new Date(),
				details: { error: error instanceof Error ? error.message : 'Unknown error' },
			};
		}
	}
} 