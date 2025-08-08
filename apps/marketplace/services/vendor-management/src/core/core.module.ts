import { Module } from '@nestjs/common';
import { MarketplaceContractsModule } from '../../../../contracts/marketplace-contracts.module';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
	imports: [MarketplaceContractsModule],
	providers: [VendorService],
	controllers: [VendorController],
	exports: [VendorService],
})
export class CoreModule {}
