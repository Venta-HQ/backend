import { BootstrapService, HealthCheckModule } from '@app/nest/modules';
import { UserModule } from './user.module';

async function bootstrap() {
	try {
		// Bootstrap gRPC microservice with health checks
		await BootstrapService.bootstrapGrpcMicroservice({
			health: {
				host: '0.0.0.0',
				module: HealthCheckModule,
				port: 'USER_HEALTH_PORT',
			},
			main: {
				defaultUrl: 'localhost:5000',
				module: UserModule,
				package: 'user',
				protoPath: '../proto/src/definitions/user.proto',
				urlEnvVar: 'USER_SERVICE_ADDRESS',
			},
		});
	} catch (error) {
		console.error('Failed to start user service:', error);
		process.exit(1);
	}
}

bootstrap();
