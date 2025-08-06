import { ClerkModule, GrpcInstanceModule } from 'libs/nest/modules';
import { VENDOR_PACKAGE_NAME, VENDOR_SERVICE_NAME, VendorServiceClient } from '@app/proto/vendor';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VendorController } from './vendor.controller';

@Module({
	controllers: [VendorController],
	imports: [
		ClerkModule.register(),
		ConfigModule,
		GrpcInstanceModule.register<VendorServiceClient>({
			proto: 'vendor.proto',
			protoPackage: VENDOR_PACKAGE_NAME,
			provide: VENDOR_SERVICE_NAME,
			serviceName: VENDOR_SERVICE_NAME,
			url: 'VENDOR_SERVICE_ADDRESS',
		}),
	],
	providers: [
		{
			provide: 'VENDOR_SERVICE_URL',
			useFactory: (configService: ConfigService) => configService.get('VENDOR_SERVICE_ADDRESS') || 'localhost:5004',
			inject: [ConfigService],
		},
	],
})
export class VendorModule {}
