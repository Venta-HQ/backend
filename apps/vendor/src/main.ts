import { BootstrapService } from '@app/nest/modules';
import { VendorModule } from './vendor.module';

async function bootstrap() {
	await BootstrapService.bootstrapGrpc({
		defaultUrl: 'localhost:5005',
		module: VendorModule,
		package: 'vendor',
		protoPath: '../proto/src/definitions/vendor.proto',
		urlEnvVar: 'VENDOR_SERVICE_ADDRESS',
	});
}

bootstrap();
