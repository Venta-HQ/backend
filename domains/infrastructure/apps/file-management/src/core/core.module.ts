import { Module } from '@nestjs/common';
import { CloudinaryACL } from '@venta/domains/infrastructure/contracts/anti-corruption-layers/cloudinary-acl';
import { InfrastructureToMarketplaceContextMapper } from '@venta/domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace.context-mapper';
import { CloudinaryService } from '@venta/nest/modules';
import { UploadController } from './controllers/upload/upload.controller';
import { UploadService } from './services/upload/upload.service';

@Module({
	controllers: [UploadController],
	providers: [
		{
			provide: UploadService,
			useFactory: () =>
				new UploadService(
					process.env.CLOUDINARY_API_KEY || '',
					process.env.CLOUDINARY_API_SECRET || '',
					process.env.CLOUDINARY_CLOUD_NAME || '',
				),
		},
		CloudinaryService,
		CloudinaryACL,
		InfrastructureToMarketplaceContextMapper,
	],
})
export class CoreModule {}
