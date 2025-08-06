import { join } from 'path';
import { ClerkModule, GrpcInstanceModule } from 'libs/nest/modules';
import { VENDOR_PACKAGE_NAME, VENDOR_SERVICE_NAME, VendorServiceClient } from '@app/proto/vendor';
import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';

@Module({
	controllers: [VendorController],
	imports: [
		ClerkModule.register(),
		GrpcInstanceModule.register<VendorServiceClient>({
			protoPackage: VENDOR_PACKAGE_NAME,
			proto: 'vendor.proto',
			provide: VENDOR_SERVICE_NAME,
			serviceName: VENDOR_SERVICE_NAME,
			urlEnvVar: 'VENDOR_SERVICE_ADDRESS',
		}),
	],
})
export class VendorModule {}
