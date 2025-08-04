import { BootstrapService } from '@app/nest/modules';
import { AppModule } from './app.module';

async function bootstrap() {
	await BootstrapService.bootstrapHttp({
		enableCors: true,
		module: AppModule,
		port: 'GATEWAY_SERVICE_PORT',
	});
}

bootstrap();
