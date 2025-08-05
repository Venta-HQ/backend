import { BootstrapService, HealthCheckModule } from '@app/nest/modules';
import { AlgoliaSyncModule } from './algolia-sync.module';

async function bootstrap() {
	try {
		// Bootstrap NATS microservice with health checks
		await BootstrapService.bootstrapNatsMicroservice({
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: 'ALGOLIA_SYNC_HEALTH_PORT',
			},
			main: {
				defaultUrl: 'nats://localhost:4222',
				module: AlgoliaSyncModule,
				queue: 'algolia-sync-queue',
				urlEnvVar: 'NATS_URL',
			},
		});
	} catch (error) {
		console.error('Failed to start algolia-sync service:', error);
		process.exit(1);
	}
}

bootstrap();
