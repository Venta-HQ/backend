import { PrismaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	exports: [VendorService],
	imports: [PrismaModule],
	providers: [VendorService],
})
export class VendorModule {}
