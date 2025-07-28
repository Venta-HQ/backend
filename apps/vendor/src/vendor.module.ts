import { RequestContextService } from 'libs/nest/modules/logger/request-context.service';
import { ConfigModule, EventsModule, GrpcLoggerModule, PrismaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	imports: [ConfigModule, GrpcLoggerModule.register('Vendor Microservice'), PrismaModule.register(), EventsModule],
	providers: [VendorService, RequestContextService],
})
export class VendorModule {}
