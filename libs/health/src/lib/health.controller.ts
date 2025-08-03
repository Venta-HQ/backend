import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

export interface HealthControllerOptions {
	serviceName: string;
	additionalChecks?: () => Promise<Record<string, any>>;
}

@Controller('health')
export class HealthController {
	private readonly serviceName: string;
	private readonly additionalChecks?: () => Promise<Record<string, any>>;

	constructor(options: HealthControllerOptions) {
		this.serviceName = options.serviceName;
		this.additionalChecks = options.additionalChecks;
	}

	/**
	 * Basic health check endpoint
	 */
	@Get()
	@HttpCode(HttpStatus.OK)
	async getHealth() {
		const baseHealth = {
			status: 'healthy',
			timestamp: new Date(),
			service: this.serviceName,
		};

		if (this.additionalChecks) {
			try {
				const additionalData = await this.additionalChecks();
				return {
					...baseHealth,
					...additionalData,
				};
			} catch (error) {
				return {
					...baseHealth,
					status: 'degraded',
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		}

		return baseHealth;
	}

	/**
	 * Detailed health check endpoint
	 */
	@Get('detailed')
	@HttpCode(HttpStatus.OK)
	async getDetailedHealth() {
		const baseHealth = {
			status: 'healthy',
			timestamp: new Date(),
			service: this.serviceName,
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			version: process.env['npm_package_version'] || 'unknown',
		};

		if (this.additionalChecks) {
			try {
				const additionalData = await this.additionalChecks();
				return {
					...baseHealth,
					...additionalData,
				};
			} catch (error) {
				return {
					...baseHealth,
					status: 'degraded',
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		}

		return baseHealth;
	}
}
