import { ConfigModule } from '@app/config';
import { PrismaModule } from '@app/database';
import { ErrorHandlingModule } from '@app/errors';
import { EventsModule } from '@app/events';
import { HealthModule } from '@app/health';
import { LoggerModule } from '@app/logger';
import { Module } from '@nestjs/common';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	controllers: [VendorController],
	imports: [
		ConfigModule,
		EventsModule,
		HealthModule.forRoot({
			serviceName: 'vendor-service',
		}),
		LoggerModule.register({ appName: 'Vendor Microservice', protocol: 'grpc' }),
		PrismaModule.register(),
		ErrorHandlingModule,
	],
	providers: [VendorService],
})
export class VendorModule {}
