import { BootstrapService, HealthCheckModule } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { VendorManagementModule } from './vendor-management.module';

async function bootstrap() {
	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			domain: 'vendor', // DDD domain for vendor management
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('VENDOR_HEALTH_PORT') || 3004,
			},
			main: {
				defaultUrl: 'localhost:5004',
				module: VendorManagementModule,
				package: 'vendor',
				protoPath: 'vendor.proto',
				url: configService.get('VENDOR_SERVICE_ADDRESS') || 'localhost:5004',
			},
		});
	} catch (error) {
		console.error('Failed to start vendor service:', error);
		process.exit(1);
	}
}

bootstrap();
