import { BootstrapService, HealthCheckModule } from '@app/nest/modules';
import { VendorModule } from './vendor.module';

async function bootstrap() {
	try {
		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: 'VENDOR_HEALTH_PORT',
			},
			main: {
				defaultUrl: 'localhost:5005',
				module: VendorModule,
				package: 'vendor',
				protoPath: 'vendor.proto',
				urlEnvVar: 'VENDOR_SERVICE_ADDRESS',
			},
		});
	} catch (error) {
		console.error('Failed to start vendor service:', error);
		process.exit(1);
	}
}

bootstrap();
