import { BootstrapModule, CloudinaryModule } from '@app/nest/modules';
import { CloudinaryACL } from '@domains/infrastructure/contracts/anti-corruption-layers/cloudinary-acl';
import { InfrastructureToMarketplaceContextMapper } from '@domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace-context-mapper';
import { Module } from '@nestjs/common';
import { FileManagementController } from './core/file-management.controller';
import { FileManagementService } from './core/file-management.service';

@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'file-management',
			domain: 'infrastructure',
			protocol: 'grpc',
		}),
		CloudinaryModule,
	],
	controllers: [FileManagementController],
	providers: [FileManagementService, CloudinaryACL, InfrastructureToMarketplaceContextMapper],
})
export class FileManagementModule {}
