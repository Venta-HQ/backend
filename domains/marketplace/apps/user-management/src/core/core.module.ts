import { Module } from '@nestjs/common';
import { ClerkAntiCorruptionLayer } from '@venta/domains/marketplace/contracts/anti-corruption-layers/clerk.acl';
import { RevenueCatAntiCorruptionLayer } from '@venta/domains/marketplace/contracts/anti-corruption-layers/revenuecat.acl';
import { BootstrapModule, PrismaModule } from '@venta/nest/modules';
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
	providers: [UserManagementService, ClerkAntiCorruptionLayer, RevenueCatAntiCorruptionLayer],
})
export class CoreModule {}
