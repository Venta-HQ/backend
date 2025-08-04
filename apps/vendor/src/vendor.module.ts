import { BootstrapModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	imports: [
		BootstrapModule.forRoot({
			appName: 'Vendor Microservice',
			protocol: 'grpc',
		}),
	],
	providers: [VendorService],
})
export class VendorModule {}
