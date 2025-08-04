import { BootstrapService } from '@app/nest/modules';
import { AlgoliaSyncModule } from './algolia-sync.module';

async function bootstrap() {
	await BootstrapService.bootstrapHttp({
		module: AlgoliaSyncModule,
		port: 'ALGOLIA_SYNC_SERVICE_PORT',
	});
}

bootstrap();
