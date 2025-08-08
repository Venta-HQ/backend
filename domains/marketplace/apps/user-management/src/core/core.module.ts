import { BootstrapModule, PrismaModule } from '@app/nest/modules';
import { ClerkAntiCorruptionLayer } from '@domains/marketplace/contracts/anti-corruption-layers/clerk-anti-corruption-layer';
import { RevenueCatAntiCorruptionLayer } from '@domains/marketplace/contracts/anti-corruption-layers/revenuecat-anti-corruption-layer';
import { MarketplaceToLocationContextMapper } from '@domains/marketplace/contracts/context-mappers/marketplace-to-location-context-mapper';
import { Module } from '@nestjs/common';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'user-management',
			domain: 'marketplace',
			protocol: 'grpc',
		}),
		PrismaModule,
	],
	controllers: [UserManagementController],
	providers: [
		UserManagementService,
		ClerkAntiCorruptionLayer,
		RevenueCatAntiCorruptionLayer,
		MarketplaceToLocationContextMapper,
	],
})
export class CoreModule {}
