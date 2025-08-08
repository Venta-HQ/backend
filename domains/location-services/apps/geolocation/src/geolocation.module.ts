import { APP_NAMES, BootstrapModule, EventsModule, RedisModule } from '@app/nest/modules';
import { Module } from '@nestjs/common';
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
