import { BootstrapService, HealthCheckModule } from '@app/nest/modules';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserModule } from './user.module';

async function bootstrap() {
	const logger = new Logger('UserService');

	try {
		// Create a temporary ConfigService instance for environment variable access
		const configService = new ConfigService();

		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: configService.get('USER_HEALTH_PORT') || 3000,
			},
			main: {
				defaultUrl: 'localhost:5000',
				module: UserModule,
				package: 'user',
				protoPath: 'user.proto',
				url: configService.get('USER_SERVICE_ADDRESS') || 'localhost:5000',
			},
		});

		logger.log('User microservice started successfully');
	} catch (error) {
		logger.error('Failed to start user microservice:', error);
		process.exit(1);
	}
}

bootstrap();
