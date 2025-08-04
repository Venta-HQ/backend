import { BootstrapService } from '@app/nest/modules';
import { VendorModule } from './vendor.module';

async function bootstrap() {
	await BootstrapService.bootstrapGrpc({
		module: VendorModule,
		package: 'vendor',
		protoPath: '../proto/src/definitions/vendor.proto',
		urlEnvVar: 'VENDOR_SERVICE_ADDRESS',
		defaultUrl: 'localhost:5005',
	});
}

bootstrap();
