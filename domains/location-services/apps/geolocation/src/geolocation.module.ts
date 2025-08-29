import { Module } from '@nestjs/common';
import { APP_NAMES, BootstrapModule } from '@venta/nest/modules';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.LOCATION,
			protocol: 'grpc',
		}),
		CoreModule,
	],
})
export class GeolocationModule {}
