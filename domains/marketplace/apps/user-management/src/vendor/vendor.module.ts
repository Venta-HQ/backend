import { Module } from '@nestjs/common';
import { PrismaModule } from '@venta/nest/modules';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	imports: [PrismaModule.register()],
	controllers: [VendorController],
	providers: [VendorService],
	exports: [VendorService],
})
export class VendorModule {}
