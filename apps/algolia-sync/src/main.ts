import { BootstrapService, HealthCheckModule } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { AlgoliaSyncModule } from './algolia-sync.module';

async function bootstrap() {
	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap NATS microservice with health checks
		await BootstrapService.bootstrapNatsMicroservice({
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('ALGOLIA_SYNC_HEALTH_PORT') || 3005,
			},
			main: {
				defaultUrl: 'nats://localhost:4222',
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
