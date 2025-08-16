import { ConfigService } from '@nestjs/config';
import { BootstrapService, HealthCheckModule, Logger } from '@venta/nest/modules';
import { UserManagementModule } from './user-management.module';

async function bootstrap() {
	const logger = new Logger().setContext('UserService');

	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			domain: 'marketplace', // DDD domain for marketplace services
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('USER_HEALTH_PORT') || 3000,
			},
			main: {
				defaultUrl: 'localhost:5000',
				module: UserManagementModule,
				package: 'user',
				protoPath: 'user.proto',
				url: configService.get('USER_SERVICE_ADDRESS') || 'localhost:5000',
			},
		});

		logger.log('User microservice started successfully');
	} catch (error) {
		logger.error('Failed to start user microservice:', error instanceof Error ? error.stack : undefined, { error });
		process.exit(1);
	}
}

bootstrap();
