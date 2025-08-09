import { Module } from '@nestjs/common';
import { VendorACL } from '@venta/domains/marketplace/contracts/anti-corruption-layers/vendor-acl';
import { EventService, PrismaModule } from '@venta/nest/modules';
import { VendorManagementController } from './vendor-management.controller';
import { VendorManagementService } from './vendor-management.service';

@Module({
	imports: [PrismaModule],
	controllers: [VendorManagementController],
	providers: [VendorManagementService, VendorACL, EventService],
})
export class CoreModule {}
