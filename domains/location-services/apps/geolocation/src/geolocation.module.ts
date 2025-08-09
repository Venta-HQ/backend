import { Module } from '@nestjs/common';
import { APP_NAMES, BootstrapModule, EventsModule, RedisModule } from '@venta/nest/modules';
import { LocationContractsModule } from '../../../contracts/location-contracts.module';
import { CoreModule } from './core/core.module';

@Module({
	imports: [
		BootstrapModule.forRoot({
			additionalModules: [RedisModule],
			appName: APP_NAMES.LOCATION,
			protocol: 'grpc',
		}),
		EventsModule.register(),
		LocationContractsModule,
		CoreModule,
		RedisModule,
	],
})
export class GeolocationModule {}
