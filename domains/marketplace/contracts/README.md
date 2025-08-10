# Marketplace Contracts

This directory contains all shared contracts, context mappers, and anti-corruption layers for the **Marketplace Domain**.

## 🏗️ **Architecture**

The Marketplace domain consists of multiple services that share common contracts:

- **user-management** - User account management
- **vendor-management** - Vendor account management
- **search-discovery** - Search and discovery functionality

All services use the same contracts to ensure consistency and reduce duplication.

### **ACL Pattern: Pure Functions over Pipes**

We use **static pure functions** instead of NestJS pipes for ACL operations:

✅ **Benefits:**

- **Perfect Type Safety** - Controllers implement gRPC interfaces correctly
- **No Magic** - Explicit transformation at controller boundary
- **Testable** - Pure functions are easy to unit test
- **Performance** - No NestJS pipe overhead
- **Clear Boundaries** - gRPC types in controller, domain types in service
- **Bidirectional** - Single file handles both inbound and outbound transformations

## 📁 **Structure**

```
📁 contracts/
├── 📁 acl/                       # Anti-Corruption Layer (ACL) functionality
│   ├── auth.acl.ts              # Authentication ACL - bidirectional gRPC ↔ Domain
│   ├── user.acl.ts              # User ACL - bidirectional gRPC ↔ Domain
│   ├── vendor.acl.ts            # Vendor ACL - bidirectional gRPC ↔ Domain
│   └── subscription.acl.ts      # Subscription ACL - bidirectional gRPC ↔ Domain
├── 📁 types/                     # Type definitions
│   ├── 📁 domain/               # Clean types for gRPC communication
│   ├── 📁 internal/             # Internal business logic types
│   └── index.ts                 # Type re-exports
└── index.ts                     # Main export file
```

## 🚀 **Usage**

### **Import ACL Classes in Services**

Since all ACLs are now pure static functions, no module imports are needed. Simply import the specific ACL classes:

```typescript
// In controllers and services
import { UserIdentityACL, VendorCreateACL } from '@venta/domains/marketplace/contracts';
```

### **Use ACL Classes in Controllers (gRPC → Domain)**

```typescript
// In gRPC controllers
import type { VendorCreateData } from '@venta/proto/marketplace/vendor-management';
import { VendorCreateACL } from '../contracts';

@Controller()
export class VendorController {
	@GrpcMethod('VendorService', 'createVendor')
	async createVendor(request: VendorCreateData): Promise<VendorResponse> {
		// Explicit validation and transformation
		const domainRequest = VendorCreateACL.toDomain(request);

		// domainRequest is now clean domain type, validated and transformed
		return this.vendorService.createVendor(domainRequest);
	}
}
```

### **Use ACL Classes for Outbound Communication (Domain → gRPC)**

```typescript
// For sending data to other domains
import { VendorLocationUpdateACL } from '../contracts';
import type { VendorLocationChange } from '../contracts/types/domain';

@Injectable()
export class LocationSyncService {
	constructor(private readonly locationClient: LocationServiceClient) {}

	async syncVendorLocation(vendorLocationChange: VendorLocationChange) {
		// Transform to gRPC format
		const grpcRequest = VendorLocationUpdateACL.toGrpc(vendorLocationChange);

		// Send to location service
		await this.locationClient.updateVendorLocation(grpcRequest);
	}
}
```

### **Use Subscription ACL Classes**

```typescript
// For handling subscription data (from webhook handlers via gRPC)
import { SubscriptionCreateACL } from '@venta/domains/marketplace/contracts';
import type { CreateSubscriptionData } from '@venta/proto/marketplace/user-management';

@Controller()
export class SubscriptionController {
	@GrpcMethod('UserManagementService')
	async handleSubscriptionCreated(request: CreateSubscriptionData): Promise<CreateSubscriptionResponse> {
		// Transform and validate gRPC subscription data to domain format
		const domainRequest = SubscriptionCreateACL.toDomain(request);

		// Use domain subscription data
		await this.subscriptionService.createSubscription(domainRequest);

		return { message: 'Success' };
	}
}
```

## 🔧 **Adding New ACL Classes**

### **1. Bidirectional ACL Class (gRPC ↔ Domain)**

```typescript
// contracts/acl/new-entity.acl.ts
import { AppError, ErrorCodes } from '@venta/nest/errors';
import type { NewEntityCreateData } from '@venta/proto/marketplace/new-service';
import type { NewEntityCreate } from '../types/domain';

export class NewEntityCreateACL {
	// gRPC → Domain (inbound)
	static validate(grpc: NewEntityCreateData): void {
		if (!grpc.name?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'name',
				message: 'Name is required',
			});
		}
	}

	static toDomain(grpc: NewEntityCreateData): NewEntityCreate {
		this.validate(grpc);

		return {
			name: grpc.name,
			// Map other fields...
		};
	}

	// Domain → gRPC (outbound)
	static validateDomain(domain: NewEntityCreate): void {
		if (!domain.name?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'name',
				message: 'Name is required',
			});
		}
	}

	static toGrpc(domain: NewEntityCreate): NewEntityCreateData {
		this.validateDomain(domain);

		return {
			name: domain.name,
			// Map other fields...
		};
	}
}
```

### **2. External Service ACL Class (External API ↔ Domain)**

```typescript
// contracts/acl/external/new-service.acl.ts
import { AppError, ErrorCodes } from '@venta/nest/errors';
import type { DomainEntity } from '../../types/domain';
import type { ExternalServiceData } from '../../types/internal';

export class NewServiceACL {
	// External API → Domain (inbound)
	static validate(external: ExternalServiceData): void {
		if (!external.external_id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'external_id',
				message: 'External ID is required',
			});
		}
	}

	static toDomain(external: ExternalServiceData): DomainEntity {
		this.validate(external);

		return {
			id: external.external_id,
			name: external.display_name,
			// Map other fields...
		};
	}

	// Domain → External API (outbound)
	static validateDomain(domain: DomainEntity): void {
		if (!domain.id?.trim()) {
			throw AppError.validation(ErrorCodes.ERR_INVALID_INPUT, {
				field: 'id',
				message: 'ID is required',
			});
		}
	}

	static toExternal(domain: DomainEntity): ExternalServiceData {
		this.validateDomain(domain);

		return {
			external_id: domain.id,
			display_name: domain.name,
			// Map other fields...
		};
	}
}
```

### **3. Update Exports**

```typescript
// contracts/index.ts
export { NewEntityCreateACL } from './acl/new-entity.acl';
export { NewServiceACL } from './acl/external/new-service.acl';
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

1. **Pure Functions**: Use static methods for predictable, testable transformations
2. **Explicit Validation**: Always validate input data before transformation
3. **Error Handling**: Use `AppError` with appropriate error codes for consistent error reporting
4. **Bidirectional Support**: Provide both `toDomain`/`toGrpc` methods in the same class for related operations
5. **Type Safety**: Leverage TypeScript and proto-generated types for compile-time safety
6. **Testing**: Write comprehensive tests for all transformation methods
7. **Documentation**: Document complex transformation logic and field mappings

## 🔄 **Migration from Service-Specific Contracts**

If you have existing service-specific contracts:

1. **Move to shared location**: Copy contracts to `apps/marketplace/contracts/`
2. **Update imports**: Change service imports to use shared contracts
3. **Remove duplicates**: Delete service-specific contract directories
4. **Test thoroughly**: Ensure all functionality works with shared contracts
