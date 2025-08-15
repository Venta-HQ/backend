import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@venta/nest/guards';
import { GrpcInstanceModule } from '@venta/nest/modules';
import {
	MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME,
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorManagementServiceClient,
} from '@venta/proto/marketplace/vendor-management';
import { VendorController } from './vendor.controller';

@Module({
	imports: [
		AuthModule,
		ConfigModule,
		GrpcInstanceModule.register<VendorManagementServiceClient>({
			proto: 'domains/marketplace/vendor-management.proto',
			protoPackage: MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME,
			provide: VENDOR_MANAGEMENT_SERVICE_NAME,
			serviceName: VENDOR_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) =>
				configService.get('VENDOR_MANAGEMENT_SERVICE_ADDRESS') || 'localhost:5004',
		}),
	],
	controllers: [VendorController],
})
export class VendorModule {}
