import { BootstrapService } from '@app/nest/modules';
import { UserModule } from './user.module';

async function bootstrap() {
	await BootstrapService.bootstrap({
		appName: 'User Service',
		grpc: {
			defaultUrl: 'localhost:5000',
			package: 'user',
			protoPath: '../proto/src/definitions/user.proto',
			urlEnvVar: 'USER_SERVICE_ADDRESS',
		},
		module: UserModule,
	});
}

bootstrap();
