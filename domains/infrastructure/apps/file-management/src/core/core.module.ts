import { CloudinaryService } from '@app/nest/modules';
import { CloudinaryACL } from '@domains/infrastructure/contracts/anti-corruption-layers/cloudinary-acl';
import { InfrastructureToMarketplaceContextMapper } from '@domains/infrastructure/contracts/context-mappers/infrastructure-to-marketplace.context-mapper';
import { Module } from '@nestjs/common';
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
