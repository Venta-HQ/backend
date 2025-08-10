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
│   ├── vendor.acl.ts             # Vendor domain ACL pipes
│   ├── clerk.acl.ts              # Clerk service ACL
│   ├── revenuecat.acl.ts         # RevenueCat service ACL
│   ├── algolia.acl.ts            # Algolia search ACL
│   ├── nats.acl.ts               # NATS messaging ACL
│   ├── to-location.acl.ts        # Outbound location transformations
│   ├── to-communication.acl.ts   # Outbound communication transformations
│   ├── to-infrastructure.acl.ts  # Outbound infrastructure transformations
│   └── acl.module.ts             # ACL module
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

### **Use Context Mappers**

```typescript
// In any marketplace service
import { MarketplaceLocationContextMapper } from '../contracts';

@Injectable()
export class UserService {
	constructor(private readonly locationMapper: MarketplaceLocationContextMapper) {}

	async updateUserLocation(userId: string, location: { lat: number; lng: number }) {
		// Translate to location services format
		const locationServicesData = this.locationMapper.toLocationServicesUserUpdate(userId, location);

		// Call location services
		await this.locationGrpcClient.updateLocation(locationServicesData);
	}
}
```

### **Use Anti-Corruption Layers**

```typescript
// In any marketplace service
import { ClerkAntiCorruptionLayer } from '../contracts';

@Injectable()
export class UserService {
	constructor(private readonly clerkACL: ClerkAntiCorruptionLayer) {}

	async handleClerkWebhook(clerkUser: any) {
		// Translate Clerk data to marketplace format
		const marketplaceUser = this.clerkACL.toMarketplaceUser(clerkUser);

		// Use marketplace user data
		await this.userRepository.create(marketplaceUser);
	}
}
```

## 🔧 **Adding New Contracts**

### **1. Context Mapper**

```typescript
// contracts/context-mappers/new-domain-context-mapper.ts
import { BaseContextMapper } from '@venta/nest/modules/contracts';

@Injectable()
export class NewDomainContextMapper extends BaseContextMapper {
	constructor() {
		super('NewDomainContextMapper');
	}

	getDomain(): string {
		return 'marketplace';
	}

	getTargetDomain(): string {
		return 'new-domain';
	}

	// Implement translation methods...
}
```

### **2. Anti-Corruption Layer**

```typescript
// contracts/acl/new-service.acl.ts
import { BaseAntiCorruptionLayer } from '@venta/nest/modules/contracts';

@Injectable()
export class NewServiceAntiCorruptionLayer extends BaseAntiCorruptionLayer {
	constructor() {
		super('NewServiceAntiCorruptionLayer');
	}

	getExternalService(): string {
		return 'new-service';
	}

	getDomain(): string {
		return 'marketplace';
	}

	// Implement translation methods...
}
```

### **3. Update Module**

```typescript
// marketplace-contracts.module.ts
import { NewServiceACL } from './acl/new-service.acl';
import { NewDomainContextMapper } from './context-mappers/new-domain-context-mapper';

@Module({
	providers: [
		// ... existing providers
		NewDomainContextMapper,
		NewServiceACL,
	],
	exports: [
		// ... existing exports
		NewDomainContextMapper,
		NewServiceACL,
	],
})
export class MarketplaceContractsModule {}
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
