import { BootstrapService, HealthCheckModule } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME } from '@app/proto/location';
import { ConfigService } from '@nestjs/config';
import { LocationModule } from './location.module';

async function bootstrap() {
	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			domain: 'location-services', // DDD domain for location services
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('LOCATION_HEALTH_PORT') || 3001,
			},
			main: {
				defaultUrl: 'localhost:5001',
				module: LocationModule,
				package: LOCATION_PACKAGE_NAME,
				protoPath: 'location.proto',
				url: configService.get('LOCATION_SERVICE_ADDRESS') || 'localhost:5001',
			},
		});
	} catch (error) {
		console.error('Failed to start location service:', error);
		process.exit(1);
	}
}

bootstrap();
