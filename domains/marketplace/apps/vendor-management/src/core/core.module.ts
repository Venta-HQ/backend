import { Module } from '@nestjs/common';
import { EventService, PrismaModule } from '@venta/nest/modules';
import { VendorManagementController } from './vendor-management.controller';
import { VendorManagementService } from './vendor-management.service';

@Module({
	imports: [PrismaModule],
	controllers: [VendorManagementController],
	providers: [VendorManagementService, EventService],
})
export class CoreModule {}
