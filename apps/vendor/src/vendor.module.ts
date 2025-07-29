import { ErrorHandlingModule } from '@app/nest/errors';
import { ConfigModule, EventsModule, LoggerModule, PrismaModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	imports: [
		ConfigModule,
		LoggerModule.register({ appName: 'Vendor Microservice', protocol: 'grpc' }),
		PrismaModule.register(),
		EventsModule,
		ErrorHandlingModule,
	],
	providers: [VendorService],
})
export class VendorModule {}
