import { ConfigService } from '@nestjs/config';
import { BootstrapService, HealthCheckModule, Logger } from '@venta/nest/modules';
import { INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME } from '@venta/proto/infrastructure/file-management';
import { FileManagementModule } from './file-management.module';

async function bootstrap() {
	const logger = new Logger().setContext('FileManagementService');

	try {
		const configService = new ConfigService();

		await BootstrapService.bootstrapGrpcMicroservice({
			domain: 'infrastructure',
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('FILE_MANAGEMENT_HEALTH_PORT') || 3015,
			},
			main: {
				module: FileManagementModule,
				package: INFRASTRUCTURE_FILE_MANAGEMENT_PACKAGE_NAME,
				protoPath: 'domains/infrastructure/file-management.proto',
				url: configService.get('FILE_MANAGEMENT_SERVICE_ADDRESS') || '0.0.0.0:5005',
			},
		});

		logger.log('File management microservice started successfully');
	} catch (error) {
		logger.error('Failed to start file management microservice:', error instanceof Error ? error.stack : undefined, {
			error,
		});
		process.exit(1);
	}
}

bootstrap();
