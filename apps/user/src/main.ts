import { BootstrapService } from '@app/nest/modules';
import { UserModule } from './user.module';

async function bootstrap() {
	await BootstrapService.bootstrapGrpc({
		defaultUrl: 'localhost:5000',
		module: UserModule,
		package: 'user',
		protoPath: '../proto/src/definitions/user.proto',
		urlEnvVar: 'USER_SERVICE_ADDRESS',
	});
}

bootstrap();
