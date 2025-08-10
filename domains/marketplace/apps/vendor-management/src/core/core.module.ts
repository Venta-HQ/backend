import { Module } from '@nestjs/common';
import { MarketplaceContractsModule } from '@venta/domains/marketplace/contracts';
import { EventService, PrismaModule } from '@venta/nest/modules';
import { VendorManagementController } from './vendor-management.controller';
import { VendorManagementService } from './vendor-management.service';

@Module({
	imports: [PrismaModule, MarketplaceContractsModule],
	controllers: [VendorManagementController],
	providers: [VendorManagementService, EventService],
})
export class CoreModule {}
