import { Module } from '@nestjs/common';
import { APP_NAMES, BootstrapModule, EventsModule } from '@venta/nest/modules';
import { CoreModule } from './core/core.module';
import { LocationModule } from './location/location.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.VENDOR,
			protocol: 'grpc',
		}),
		EventsModule.register(), // No longer needs appName parameter
		CoreModule,
		LocationModule,
	],
})
export class VendorManagementModule {}
