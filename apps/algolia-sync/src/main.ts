import { BootstrapService } from '@app/nest/modules';
import { AlgoliaSyncModule } from './algolia-sync.module';

async function bootstrap() {
	await BootstrapService.bootstrap({
		appName: 'Algolia Sync Service',
		http: {
			port: 'ALGOLIA_SYNC_SERVICE_HTTP_PORT',
		},
		module: AlgoliaSyncModule,
		nats: {
			queue: 'algolia-sync',
			servers: process.env.NATS_URL || 'nats://localhost:4222',
		},
	});
}

bootstrap();
