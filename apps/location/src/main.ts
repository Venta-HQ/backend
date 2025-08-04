import { BootstrapService } from '@app/nest/modules';
import { LOCATION_PACKAGE_NAME } from '@app/proto/location';
import { LocationModule } from './location.module';

async function bootstrap() {
	await BootstrapService.bootstrapGrpc({
		defaultUrl: 'localhost:5001',
		module: LocationModule,
		package: LOCATION_PACKAGE_NAME,
		protoPath: '../proto/src/definitions/location.proto',
		urlEnvVar: 'LOCATION_SERVICE_ADDRESS',
	});
}

bootstrap();
