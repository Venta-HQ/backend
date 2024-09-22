import { LoggerModule, PrismaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	imports: [ConfigModule.forRoot(), LoggerModule.register('Vendor Microservice'), PrismaModule.register()],
	providers: [VendorService],
})
export class VendorModule {}
