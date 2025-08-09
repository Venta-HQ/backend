import { Module } from '@nestjs/common';
import { PrometheusModule } from '@venta/nest/modules';
import { CloudinaryACL } from './anti-corruption-layers/cloudinary.acl';
import { UserHttpACL } from './anti-corruption-layers/user-http.acl';
import { VendorHttpACL } from './anti-corruption-layers/vendor-http.acl';

/**
 * Infrastructure Contracts Module
 *
 * Provides all shared contracts, context mappers, and anti-corruption layers
 * for the entire infrastructure domain (api-gateway, file-management)
 */
@Module({
	imports: [PrometheusModule.register()],
	providers: [
		// Context Mappers (as functions, export the namespace for DI via custom providers if needed)
		// For now, we expose via exports barrel; functions are not DI providers.

		// ACLs
		CloudinaryACL,
		UserHttpACL,
		VendorHttpACL,
	],
	exports: [
		// ACLs
		CloudinaryACL,
		UserHttpACL,
		VendorHttpACL,
	],
})
export class InfrastructureContractsModule {}
