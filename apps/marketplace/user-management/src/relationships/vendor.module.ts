import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { PrismaModule } from '@app/nest/modules';

@Module({
	imports: [PrismaModule],
	controllers: [VendorController],
	providers: [VendorService],
	exports: [VendorService],
})
export class VendorModule {} 