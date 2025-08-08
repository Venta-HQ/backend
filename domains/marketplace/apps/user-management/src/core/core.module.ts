import { Module } from '@nestjs/common';
import { CommunicationContractsModule } from '../../../../../communication/contracts/communication-contracts.module';
import { MarketplaceContractsModule } from '../../../../contracts/marketplace-contracts.module';
import { UserService } from './user.service';

@Module({
	imports: [MarketplaceContractsModule, CommunicationContractsModule],
	exports: [UserService],
	providers: [UserService],
})
export class CoreModule {}
