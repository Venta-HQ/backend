import { Module } from '@nestjs/common';
import { ACLModule } from './acl/acl.module';

/**
 * Marketplace Contracts Module
 *
 * Provides all shared contracts and Anti-Corruption Layer (ACL) functionality
 * for the marketplace domain.
 */
@Module({
	imports: [ACLModule],
	exports: [ACLModule],
})
export class MarketplaceContractsModule {}
