import { ConfigService } from '@nestjs/config';
import { BootstrapService, HealthCheckModule, Logger } from '@venta/nest/modules';
import { GeolocationModule } from './geolocation.module';

async function bootstrap() {
	const logger = new Logger().setContext('GeolocationService');

	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			domain: 'location-services', // DDD domain for location services
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('LOCATION_HEALTH_PORT') || 3002,
			},
			main: {
				module: GeolocationModule,
				package: 'location',
				protoPath: 'location.proto',
				url: configService.get('LOCATION_SERVICE_ADDRESS') || 'localhost:5002',
			},
		});

		logger.log('Geolocation microservice started successfully');
	} catch (error) {
		logger.error('Failed to start geolocation microservice:', error instanceof Error ? error.stack : undefined, {
			error,
		});
		process.exit(1);
	}
}

bootstrap();
