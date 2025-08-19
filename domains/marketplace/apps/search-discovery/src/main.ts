import { ConfigService } from '@nestjs/config';
import { BootstrapService, HealthCheckModule } from '@venta/nest/modules';
import { AlgoliaSyncModule } from './algolia-sync.module';

async function bootstrap() {
	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap NATS microservice with health checks
		await BootstrapService.bootstrapNatsMicroservice({
			domain: 'marketplace', // DDD domain for marketplace services
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('ALGOLIA_SYNC_HEALTH_PORT') || 3005,
			},
			main: {
				module: AlgoliaSyncModule,
				queue: 'algolia-sync-queue',
				url: configService.get('NATS_URL') || 'nats://localhost:4222',
			},
		});
	} catch (error) {
		console.error('Failed to start algolia-sync service:', error);
		process.exit(1);
	}
}

bootstrap();
