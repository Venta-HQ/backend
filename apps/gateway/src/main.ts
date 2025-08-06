import { BootstrapService } from '@app/nest/modules';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap HTTP service with health checks included
		await BootstrapService.bootstrapHttpService({
			enableCors: true,
			module: AppModule,
			port: configService.get('GATEWAY_SERVICE_PORT') || 3002,
		});
	} catch (error) {
		console.error('Failed to start gateway service:', error);
		process.exit(1);
	}
}

bootstrap();
