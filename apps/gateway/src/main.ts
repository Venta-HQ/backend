import { BootstrapService } from '@app/nest/modules';
import { AppModule } from './app.module';

async function bootstrap() {
	await BootstrapService.bootstrap({
		appName: 'Gateway Service',
		http: {
			enableCors: true,
			port: 'GATEWAY_SERVICE_PORT',
		},
		module: AppModule,
	});
}

bootstrap();
