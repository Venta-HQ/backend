import { BootstrapService, HealthCheckModule } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME } from '@app/proto/location';
import { LocationModule } from './location.module';

async function bootstrap() {
	try {
		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: 'LOCATION_HEALTH_PORT',
			},
			main: {
				defaultUrl: 'localhost:5001',
				module: LocationModule,
				package: LOCATION_PACKAGE_NAME,
				protoPath: '../proto/src/definitions/location.proto',
				urlEnvVar: 'LOCATION_SERVICE_ADDRESS',
			},
		});
	} catch (error) {
		console.error('Failed to start location service:', error);
		process.exit(1);
	}
}

bootstrap();
