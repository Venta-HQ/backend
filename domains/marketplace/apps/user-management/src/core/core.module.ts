import { Module } from '@nestjs/common';
import { MarketplaceContractsModule } from '@venta/domains/marketplace/contracts';
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
		MarketplaceContractsModule,
	],
	controllers: [UserManagementController],
	providers: [UserManagementService],
})
export class CoreModule {}
