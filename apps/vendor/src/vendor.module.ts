import { RequestContextService } from 'libs/nest/modules/logger/request-context.service';
import { EventsModule, GrpcLoggerModule, HealthModule, PrismaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	imports: [
		ConfigModule.forRoot(),
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'vendor-service',
		}),
		GrpcLoggerModule.register('Vendor Microservice'),
		PrismaModule.register(),
	],
	providers: [VendorService, RequestContextService],
})
export class VendorModule {}
