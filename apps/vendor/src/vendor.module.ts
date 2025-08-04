import { EventsModule, HealthModule, LoggerModule, PrismaModule, ConfigModule } from '@app/nest/modules';
import { ErrorHandlingModule } from '@app/nest/errors';
import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	imports: [
		ConfigModule,
		ErrorHandlingModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'vendor-service',
		}),
		LoggerModule.register({ appName: 'Vendor Microservice', protocol: 'grpc' }),
		PrismaModule.register(),
	],
	providers: [VendorService],
})
export class VendorModule {}
