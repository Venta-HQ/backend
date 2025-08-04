import { BootstrapService } from '@app/nest/modules';
import { AppModule } from './app.module';

async function bootstrap() {
	await BootstrapService.bootstrapHttp({
		module: AppModule,
		port: 'GATEWAY_SERVICE_PORT',
		enableCors: true,
	});
}

bootstrap();
