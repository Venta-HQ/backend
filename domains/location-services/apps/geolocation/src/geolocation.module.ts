import { Module } from '@nestjs/common';
import { APP_NAMES, BootstrapModule, EventsModule, RedisModule } from '@venta/nest/modules';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [RedisModule],
			appName: APP_NAMES.LOCATION,
			protocol: 'grpc',
		}),
		EventsModule.register(),
		CoreModule,
		RedisModule,
	],
})
export class GeolocationModule {}
