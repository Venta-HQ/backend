import { Module } from '@nestjs/common';
import { CommunicationContractsModule } from '../../../../../communication/contracts/communication-contracts.module';
import { MarketplaceContractsModule } from '../../../../contracts/marketplace-contracts.module';
import { UserManagementService } from './user-management.service';

@Module({
	imports: [MarketplaceContractsModule, CommunicationContractsModule],
	exports: [UserManagementService],
	providers: [UserManagementService],
})
export class CoreModule {}
