import { BootstrapService } from '@app/nest/modules';
import { VendorModule } from './vendor.module';

async function bootstrap() {
	await BootstrapService.bootstrap({
		appName: 'Vendor Service',
		grpc: {
			defaultUrl: 'localhost:5005',
			package: 'vendor',
			protoPath: '../proto/src/definitions/vendor.proto',
			urlEnvVar: 'VENDOR_SERVICE_ADDRESS',
		},
		module: VendorModule,
	});
}

bootstrap();
