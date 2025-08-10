# Marketplace Contracts

This directory contains all shared contracts, context mappers, and anti-corruption layers for the **Marketplace Domain**.

## 🏗️ **Architecture**

The Marketplace domain consists of multiple services that share common contracts:

- **user-management** - User account management
- **vendor-management** - Vendor account management
- **search-discovery** - Search and discovery functionality

All services use the same contracts to ensure consistency and reduce duplication.

## 📁 **Structure**

```
📁 contracts/
├── 📁 acl/                       # Anti-Corruption Layer (ACL) functionality
│   ├── 📁 inbound/              # gRPC → Domain transformations
│   │   ├── user.acl.ts          # User-related inbound ACLs
│   │   └── vendor.acl.ts        # Vendor-related inbound ACLs
│   ├── 📁 outbound/             # Domain → gRPC transformations (to other domains)
│   │   ├── communication.acl.ts # To communication domain
│   │   ├── infrastructure.acl.ts # To infrastructure domain
│   │   └── location.acl.ts      # To location services domain
│   ├── 📁 external/             # External API → Domain transformations
│   │   ├── clerk.acl.ts         # Clerk authentication service
│   │   ├── revenuecat.acl.ts    # RevenueCat subscription service
│   │   ├── algolia.acl.ts       # Algolia search service
│   │   └── nats.acl.ts          # NATS messaging service
│   └── acl.module.ts            # Consolidated ACL module
├── 📁 schemas/                   # Zod validation schemas
│   ├── user/
│   ├── vendor/
│   └── search/
├── 📁 types/                     # Type definitions
│   ├── 📁 domain/               # Clean types for gRPC communication
│   ├── 📁 internal/             # Internal business logic types
│   └── legacy types (removed).ts # Legacy namespace types
├── 📁 utils/                     # Utility functions
├── marketplace-contracts.module.ts
└── index.ts
```

## 🚀 **Usage**

### **Import in Marketplace Services**

```typescript
// In user-management.module.ts or vendor-management.module.ts
import { MarketplaceContractsModule } from '../contracts/marketplace-contracts.module';

@Module({
	imports: [
		MarketplaceContractsModule,
		// ... other modules
	],
})
export class UserManagementModule {}
```

### **Use Inbound ACL Pipes**

```typescript
// In gRPC controllers
import { VendorCreateACLPipe } from '../contracts';
import type { VendorCreate } from '../contracts/types/domain';

@Controller()
export class VendorController {
	@GrpcMethod('VendorService', 'createVendor')
	@UsePipes(VendorCreateACLPipe)
	async createVendor(request: VendorCreate): Promise<VendorResponse> {
		// request is now clean domain type, validated and transformed
		return this.vendorService.createVendor(request);
	}
}
```

### **Use Outbound ACL Pipes**

```typescript
// For sending data to other domains
import { VendorLocationUpdateLocationACLPipe } from '../contracts';
import type { VendorLocationChange } from '../contracts/types/domain';

@Injectable()
export class LocationSyncService {
	constructor(private readonly locationClient: LocationServiceClient) {}

	async syncVendorLocation(vendorLocationChange: VendorLocationChange) {
		// Transform to location service format
		const pipe = new VendorLocationUpdateLocationACLPipe();
		const locationRequest = pipe.transform(vendorLocationChange, {} as ArgumentMetadata);

		// Send to location service
		await this.locationClient.updateVendorLocation(locationRequest);
	}
}
```

### **Use External Service ACL Pipes**

```typescript
// For handling external service data
import { ClerkUserTransformACLPipe } from '../contracts';
import type { ClerkUser } from '../contracts/types/internal';

@Injectable()
export class UserService {
	async handleClerkWebhook(clerkUser: ClerkUser) {
		// Transform Clerk data to domain format
		const pipe = new ClerkUserTransformACLPipe();
		const domainUser = pipe.transform(clerkUser, {} as ArgumentMetadata);

		// Use domain user data
		await this.userRepository.create(domainUser);
	}
}
```

## 🔧 **Adding New ACL Pipes**

### **1. Inbound ACL Pipe (gRPC → Domain)**

```typescript
// contracts/acl/inbound/new-entity.acl.ts
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import type { NewEntityCreateData } from '@venta/proto/marketplace/new-service';
import type { NewEntityCreate } from '../../types/domain';

@Injectable()
export class NewEntityCreateACLPipe implements PipeTransform<NewEntityCreateData, NewEntityCreate> {
	private validator = new SchemaValidatorPipe(GrpcNewEntityCreateDataSchema);

	transform(value: NewEntityCreateData, metadata: ArgumentMetadata): NewEntityCreate {
		const validated = this.validator.transform(value, metadata);

		return {
			name: validated.name,
			// Map other fields...
		};
	}
}
```

### **2. Outbound ACL Pipe (Domain → gRPC)**

```typescript
// contracts/acl/outbound/new-domain.acl.ts
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import type { NewEntityUpdate } from '../../types/domain';

@Injectable()
export class NewEntityUpdateNewDomainACLPipe implements PipeTransform<NewEntityUpdate, NewDomainRequest> {
	transform(value: NewEntityUpdate, _metadata: ArgumentMetadata): NewDomainRequest {
		return {
			entityId: value.id,
			data: value.data,
			timestamp: new Date().toISOString(),
		};
	}
}
```

### **3. External Service ACL Pipe (External API → Domain)**

```typescript
// contracts/acl/external/new-service.acl.ts
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { SchemaValidatorPipe } from '@venta/nest/pipes';
import type { DomainEntity } from '../../types/domain';
import type { ExternalServiceData } from '../../types/internal';

@Injectable()
export class NewServiceACLPipe implements PipeTransform<ExternalServiceData, DomainEntity> {
	private validator = new SchemaValidatorPipe(ExternalServiceSchema);

	transform(value: ExternalServiceData, metadata: ArgumentMetadata): DomainEntity {
		const validated = this.validator.transform(value, metadata);

		return {
			id: validated.external_id,
			name: validated.display_name,
			// Map other fields...
		};
	}
}
```

### **4. Update ACL Module**

```typescript
// contracts/acl/acl.module.ts
import { NewEntityCreateACLPipe } from './inbound/new-entity.acl';
import { NewEntityUpdateNewDomainACLPipe } from './outbound/new-domain.acl';
import { NewServiceACLPipe } from './external/new-service.acl';

@Module({
	providers: [
		// ... existing providers
		NewEntityCreateACLPipe,
		NewEntityUpdateNewDomainACLPipe,
		NewServiceACLPipe,
	],
	exports: [
		// ... existing exports
		NewEntityCreateACLPipe,
		NewEntityUpdateNewDomainACLPipe,
		NewServiceACLPipe,
	],
})
```

## 🧪 **Testing**

All contracts should be thoroughly tested:

```typescript
describe('MarketplaceLocationContextMapper', () => {
	let mapper: MarketplaceLocationContextMapper;

	beforeEach(() => {
		mapper = new MarketplaceLocationContextMapper();
	});

	it('should translate marketplace location to location services format', () => {
		const result = mapper.toLocationServicesUserUpdate('user-123', { lat: 40.7128, lng: -74.006 });

		expect(result.entityId).toBe('user-123');
		expect(result.coordinates.latitude).toBe(40.7128);
		expect(result.coordinates.longitude).toBe(-74.006);
	});
});
```

## 📋 **Best Practices**

1. **Extend Base Classes**: Always extend `BaseContextMapper` or `BaseAntiCorruptionLayer`
2. **Use Validation**: Implement proper validation in `validateSourceData` and `validateTargetData`
3. **Error Handling**: Use the base class error creation methods
4. **Logging**: Use the base class logging methods for consistency
5. **Testing**: Write comprehensive tests for all translation methods
6. **Documentation**: Document complex translation logic

## 🔄 **Migration from Service-Specific Contracts**

If you have existing service-specific contracts:

1. **Move to shared location**: Copy contracts to `apps/marketplace/contracts/`
2. **Update imports**: Change service imports to use shared contracts
3. **Remove duplicates**: Delete service-specific contract directories
4. **Test thoroughly**: Ensure all functionality works with shared contracts
