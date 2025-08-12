import { ConfigService } from '@nestjs/config';
import { BootstrapService, HealthCheckModule } from '@venta/nest/modules';
import { MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME } from '@venta/proto/marketplace/vendor-management';
import { VendorManagementModule } from './vendor-management.module';

async function bootstrap() {
	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			domain: 'marketplace', // DDD domain for marketplace services
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('VENDOR_HEALTH_PORT') || 3004,
			},
			main: {
				defaultUrl: 'localhost:5004',
				module: VendorManagementModule,
				package: MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME,
				protoPath: 'domains/marketplace/vendor-management.proto',
				url: configService.get('VENDOR_SERVICE_ADDRESS') || 'localhost:5004',
			},
		});
	} catch (error) {
		console.error('Failed to start vendor service:', error);
		process.exit(1);
	}
}

bootstrap();
