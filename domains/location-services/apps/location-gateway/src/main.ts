import { ConfigService } from '@nestjs/config';
import { BootstrapService } from '@venta/nest/modules';
import { LocationGatewayModule } from './location-gateway.module';

async function bootstrap() {
	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap HTTP service with health checks included
		await BootstrapService.bootstrapHttpService({
			domain: 'location-services', // DDD domain for location services
			module: LocationGatewayModule,
			port: configService.get('LOCATION_GATEWAY_SERVICE_PORT') || 3003,
		});
	} catch (error) {
		console.error('Failed to start websocket-gateway service:', error);
		process.exit(1);
	}
}

bootstrap();
