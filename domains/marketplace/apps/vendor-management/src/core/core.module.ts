import { EventService, PrismaModule } from '@app/nest/modules';
import { VendorACL } from '@domains/marketplace/contracts/anti-corruption-layers/vendor-acl';
import { Module } from '@nestjs/common';
import { VendorManagementController } from './vendor-management.controller';
import { VendorManagementService } from './vendor-management.service';

@Module({
	imports: [PrismaModule],
	controllers: [VendorManagementController],
	providers: [VendorManagementService, VendorACL, EventService],
})
export class CoreModule {}
