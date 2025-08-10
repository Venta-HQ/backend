import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BootstrapService, HealthCheckModule } from '@venta/nest/modules';
import { GeolocationModule } from './geolocation.module';

async function bootstrap() {
	const logger = new Logger('GeolocationService');

	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			domain: 'location-services', // DDD domain for location services
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('GEOLOCATION_HEALTH_PORT') || 3002,
			},
			main: {
				defaultUrl: 'localhost:5002',
				module: GeolocationModule,
				package: 'location',
				protoPath: 'location.proto',
				url: configService.get('GEOLOCATION_SERVICE_ADDRESS') || 'localhost:5002',
			},
		});

		logger.log('Geolocation microservice started successfully');
	} catch (error) {
		logger.error('Failed to start geolocation microservice:', error);
		process.exit(1);
	}
}

bootstrap();
