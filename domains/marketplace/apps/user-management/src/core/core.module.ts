import { ClerkAntiCorruptionLayer } from '@domains/marketplace/contracts/anti-corruption-layers/clerk.acl';
import { RevenueCatAntiCorruptionLayer } from '@domains/marketplace/contracts/anti-corruption-layers/revenuecat.acl';
import { Module } from '@nestjs/common';
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
