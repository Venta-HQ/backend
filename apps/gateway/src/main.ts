import { BootstrapService } from '@app/nest/modules';
import { AppModule } from './app.module';

async function bootstrap() {
	try {
		// Bootstrap HTTP service with health checks included
		await BootstrapService.bootstrapHttpService({
			enableCors: true,
			module: AppModule,
			port: 'GATEWAY_SERVICE_PORT',
		});
	} catch (error) {
		console.error('Failed to start gateway service:', error);
		process.exit(1);
	}
}

bootstrap();
