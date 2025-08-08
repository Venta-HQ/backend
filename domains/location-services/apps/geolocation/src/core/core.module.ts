import { BootstrapModule, PrismaModule, RedisModule } from '@app/nest/modules';
import { LocationExternalServiceACL } from '@domains/location-services/contracts/anti-corruption-layers/location-external-service-acl';
import { LocationToMarketplaceContextMapper } from '@domains/location-services/contracts/context-mappers/location-to-marketplace-context-mapper';
import { Module } from '@nestjs/common';
import { GeolocationController } from './geolocation.controller';
import { GeolocationService } from './geolocation.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'geolocation',
			domain: 'location-services',
			protocol: 'grpc',
		}),
		PrismaModule,
		RedisModule,
	],
	controllers: [GeolocationController],
	providers: [GeolocationService, LocationExternalServiceACL, LocationToMarketplaceContextMapper],
})
export class CoreModule {}
