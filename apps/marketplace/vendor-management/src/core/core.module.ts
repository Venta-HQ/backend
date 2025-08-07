import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	providers: [VendorService],
	controllers: [VendorController],
	exports: [VendorService],
})
export class CoreModule {}
