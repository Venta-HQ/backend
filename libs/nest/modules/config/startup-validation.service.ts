import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StartupValidationService implements OnModuleInit {
	private readonly logger = new Logger(StartupValidationService.name);

	constructor(private readonly configService: ConfigService) {}

	onModuleInit() {
		this.validateRequiredEnvironmentVariables();
	}

	private validateRequiredEnvironmentVariables() {
		const requiredVars = [
			'DATABASE_URL',
			'REDIS_URL',
			'REDIS_PASSWORD',
			'CLERK_SECRET_KEY',
			'ALGOLIA_APPLICATION_ID',
			'ALGOLIA_API_KEY',
			'CLOUDINARY_CLOUD_NAME',
			'CLOUDINARY_API_KEY',
			'CLOUDINARY_API_SECRET',
			'PULSE_API_KEY',
			'LOKI_URL',
			'USER_SERVICE_ADDRESS',
			'VENDOR_SERVICE_ADDRESS',
			'LOCATION_SERVICE_ADDRESS',
		];

		const missingVars: string[] = [];

		for (const envVar of requiredVars) {
			const value = this.configService.get(envVar);
			if (!value) {
				missingVars.push(envVar);
			}
		}

		if (missingVars.length > 0) {
			const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
			this.logger.error(errorMessage);
			throw new Error(errorMessage);
		}

		this.logger.log('All required environment variables are present');
	}
} 