import { BootstrapService } from '@app/nest/modules';
import { UserModule } from './user.module';

async function bootstrap() {
	await BootstrapService.bootstrapGrpc({
		module: UserModule,
		package: 'user',
		protoPath: '../proto/src/definitions/user.proto',
		urlEnvVar: 'USER_SERVICE_ADDRESS',
		defaultUrl: 'localhost:5000',
	});
}

bootstrap();
