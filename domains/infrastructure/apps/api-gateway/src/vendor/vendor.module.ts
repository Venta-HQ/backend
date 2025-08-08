import { ClerkModule, GrpcInstanceModule } from '@app/nest/modules';
import {
	MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME,
	VENDOR_MANAGEMENT_SERVICE_NAME,
	VendorManagementServiceClient,
} from '@app/proto/marketplace/vendor-management';
import { VendorHttpACL } from '@domains/infrastructure/contracts/anti-corruption-layers/vendor-http-acl';
import { InfrastructureToMarketplaceContextMapper } from '@domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace-context-mapper';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VendorController } from './vendor.controller';

@Module({
	controllers: [VendorController],
	imports: [
		ClerkModule.register(),
		ConfigModule,
		GrpcInstanceModule.register<VendorManagementServiceClient>({
			proto: 'vendor.proto',
			protoPackage: MARKETPLACE_VENDOR_MANAGEMENT_PACKAGE_NAME,
			provide: VENDOR_MANAGEMENT_SERVICE_NAME,
			serviceName: VENDOR_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) => configService.get('VENDOR_SERVICE_ADDRESS') || 'localhost:5004',
		}),
	],
	providers: [VendorHttpACL, InfrastructureToMarketplaceContextMapper],
})
export class VendorModule {}
