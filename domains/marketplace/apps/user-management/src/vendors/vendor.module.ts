import { Module } from '@nestjs/common';
import { PrismaModule } from '@venta/nest/modules';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	exports: [VendorService],
	imports: [PrismaModule],
	providers: [VendorService],
})
export class VendorModule {}
