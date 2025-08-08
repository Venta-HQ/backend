import { Module } from '@nestjs/common';
import { VendorManagementController } from './vendor-management.controller';
import { VendorManagementService } from './vendor-management.service';

@Module({
	controllers: [VendorManagementController],
	providers: [VendorManagementService],
	exports: [VendorManagementService],
})
export class CoreModule {}
