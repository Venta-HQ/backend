# Domain-Focused Contracts Architecture

## 🎯 **Overview**

This document describes our **domain-focused contract architecture** that follows DDD (Domain-Driven Design) principles while maintaining consistency and reusability across domains.

## 🏗️ **Architecture Principles**

### **1. Domain Autonomy**
- Each domain owns its contracts
- Domains can evolve independently
- Clear domain boundaries

### **2. Shared Infrastructure**
- Common base classes for consistency
- Shared patterns and utilities
- Technical infrastructure in shared libraries

### **3. Cross-Domain Communication**
- Type-safe interfaces between domains
- Clear contracts for inter-domain calls
- Validation at domain boundaries

## 📁 **Current Structure**

```
📁 apps/                          # Domain-specific implementations
├── 📁 marketplace/
│   ├── 📁 contracts/            # Marketplace domain contracts
│   │   ├── 📁 context-mappers/
│   │   │   ├── marketplace-location-context-mapper.ts
│   │   │   ├── marketplace-communication-context-mapper.ts
│   │   │   └── marketplace-infrastructure-context-mapper.ts
│   │   ├── 📁 anti-corruption-layers/
│   │   │   ├── clerk-anti-corruption-layer.ts
│   │   │   └── revenuecat-anti-corruption-layer.ts
│   │   ├── marketplace-contracts.module.ts
│   │   └── index.ts
│   ├── 📁 user-management/      # Service implementation
│   ├── 📁 vendor-management/    # Service implementation
│   └── 📁 search-discovery/     # Service implementation
├── 📁 location-services/
│   ├── 📁 contracts/            # Location services domain contracts
│   │   ├── 📁 context-mappers/
│   │   │   └── location-marketplace-context-mapper.ts
│   │   ├── 📁 anti-corruption-layers/
│   │   │   └── location-external-service-acl.ts
│   │   ├── location-contracts.module.ts
│   │   └── index.ts
│   ├── 📁 geolocation/          # Service implementation
│   └── 📁 real-time/            # Service implementation
├── 📁 communication/
│   ├── 📁 contracts/            # Communication domain contracts
│   │   ├── 📁 context-mappers/
│   │   │   └── communication-marketplace-context-mapper.ts
│   │   ├── communication-contracts.module.ts
│   │   └── index.ts
│   └── 📁 webhooks/             # Service implementation
└── 📁 infrastructure/
    ├── 📁 contracts/            # Infrastructure domain contracts
    │   ├── 📁 context-mappers/
    │   │   └── infrastructure-marketplace-context-mapper.ts
    │   ├── infrastructure-contracts.module.ts
    │   └── index.ts
    ├── 📁 api-gateway/          # Service implementation
    └── 📁 file-management/      # Service implementation

📁 libs/                          # Shared infrastructure only
├── 🪺 nest/modules/contracts/   # Base classes and utilities
│   ├── 📁 base/
│   │   ├── base-context-mapper.ts
│   │   └── base-anti-corruption-layer.ts
│   ├── contract-registration.service.ts
│   ├── contract-factory.service.ts
│   └── contracts.module.ts
├── 📝 apitypes/domains/         # Cross-domain communication types
├── 🔄 eventtypes/domains/       # Cross-domain event types
└── 📡 proto/domains/            # Transport layer definitions
```

## 🚀 **Usage Patterns**

### **1. Importing Domain Contracts**

```typescript
// In any marketplace service
import { MarketplaceContractsModule } from '../contracts/marketplace-contracts.module';

@Module({
  imports: [
    MarketplaceContractsModule,
    // ... other modules
  ],
})
export class UserManagementModule {}
```

### **2. Using Context Mappers**

```typescript
// In marketplace service
import { MarketplaceLocationContextMapper } from '../contracts';

@Injectable()
export class UserService {
  constructor(
    private readonly locationMapper: MarketplaceLocationContextMapper,
  ) {}

  async updateUserLocation(userId: string, location: { lat: number; lng: number }) {
    // Translate to location services format
    const locationServicesData = this.locationMapper.toLocationServicesUserUpdate(userId, location);
    
    // Call location services
    await this.locationGrpcClient.updateLocation(locationServicesData);
  }
}
```

### **3. Using Anti-Corruption Layers**

```typescript
// In marketplace service
import { ClerkAntiCorruptionLayer } from '../contracts';

@Injectable()
export class UserService {
  constructor(
    private readonly clerkACL: ClerkAntiCorruptionLayer,
  ) {}

  async handleClerkWebhook(clerkUser: any) {
    // Translate Clerk data to marketplace format
    const marketplaceUser = this.clerkACL.toMarketplaceUser(clerkUser);
    
    // Use marketplace user data
    await this.userRepository.create(marketplaceUser);
  }
}
```

## 🔧 **Adding New Contracts**

### **1. Context Mapper Template**

```typescript
// apps/{domain}/contracts/context-mappers/{domain}-{target}-context-mapper.ts
import { Injectable } from '@nestjs/common';
import { BaseContextMapper } from '@app/nest/modules/contracts';

@Injectable()
export class DomainTargetContextMapper extends BaseContextMapper {
  constructor() {
    super('DomainTargetContextMapper');
  }

  getDomain(): string {
    return 'domain-name';
  }

  getTargetDomain(): string {
    return 'target-domain';
  }

  // Implement translation methods...
  toTargetDomainData(sourceData: any) {
    this.logTranslationStart('toTargetDomainData', { /* context */ });

    try {
      this.validateSourceData(sourceData);
      
      const targetData = {
        // Transform data...
      };

      this.validateTargetData(targetData);
      this.logTranslationSuccess('toTargetDomainData', { /* context */ });
      return targetData;
    } catch (error) {
      this.logTranslationError('toTargetDomainData', error, { /* context */ });
      throw error;
    }
  }

  validateSourceData(data: any): boolean {
    // Implement validation...
    return true;
  }

  validateTargetData(data: any): boolean {
    // Implement validation...
    return true;
  }
}
```

### **2. Anti-Corruption Layer Template**

```typescript
// apps/{domain}/contracts/anti-corruption-layers/{domain}-{service}-acl.ts
import { Injectable } from '@nestjs/common';
import { BaseAntiCorruptionLayer } from '@app/nest/modules/contracts';

@Injectable()
export class DomainServiceACL extends BaseAntiCorruptionLayer {
  constructor() {
    super('DomainServiceACL');
  }

  getExternalService(): string {
    return 'external-service-name';
  }

  getDomain(): string {
    return 'domain-name';
  }

  // Implement translation methods...
  toDomainData(externalData: any) {
    this.logTranslationStart('toDomainData', { /* context */ });

    try {
      this.validateExternalData(externalData);
      
      const domainData = {
        // Transform data...
      };

      this.validateDomainData(domainData);
      this.logTranslationSuccess('toDomainData', { /* context */ });
      return domainData;
    } catch (error) {
      this.logTranslationError('toDomainData', error, { /* context */ });
      throw error;
    }
  }

  validateExternalData(data: any): boolean {
    // Implement validation...
    return true;
  }

  validateDomainData(data: any): boolean {
    // Implement validation...
    return true;
  }
}
```

### **3. Update Domain Contracts Module**

```typescript
// apps/{domain}/contracts/{domain}-contracts.module.ts
import { Module } from '@nestjs/common';
import { ContractsModule } from '@app/nest/modules/contracts';

// Import new contracts
import { NewContextMapper } from './context-mappers/new-context-mapper';
import { NewAntiCorruptionLayer } from './anti-corruption-layers/new-acl';

@Module({
  imports: [ContractsModule],
  providers: [
    // Add new providers
    NewContextMapper,
    NewAntiCorruptionLayer,
  ],
  exports: [
    // Add new exports
    NewContextMapper,
    NewAntiCorruptionLayer,
  ],
})
export class DomainContractsModule {}
```

## 🧪 **Testing Strategy**

### **1. Unit Testing Context Mappers**

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

  it('should validate source data', () => {
    expect(() => mapper.toLocationServicesUserUpdate('user-123', null)).toThrow();
  });
});
```

### **2. Integration Testing**

```typescript
describe('Marketplace Contracts Integration', () => {
  let module: TestingModule;
  let locationMapper: MarketplaceLocationContextMapper;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [MarketplaceContractsModule],
    }).compile();

    locationMapper = module.get<MarketplaceLocationContextMapper>(MarketplaceLocationContextMapper);
  });

  it('should provide context mappers', () => {
    expect(locationMapper).toBeDefined();
  });
});
```

## 📊 **Benefits Achieved**

### **✅ Domain Autonomy**
- Each domain owns its contracts
- Independent evolution
- Clear ownership

### **✅ Consistency**
- Shared base classes
- Common patterns
- Standardized validation

### **✅ Maintainability**
- Clear structure
- Easy to find contracts
- Well-documented patterns

### **✅ Scalability**
- Easy to add new domains
- Reusable patterns
- Type safety

### **✅ Team Efficiency**
- Clear boundaries
- Independent development
- Reduced coordination

## 🔄 **Migration from Previous Structure**

### **Before (Service-Specific)**
```
apps/marketplace/user-management/src/contracts/
apps/marketplace/vendor-management/src/contracts/
```

### **After (Domain-Focused)**
```
apps/marketplace/contracts/  # Shared across all marketplace services
```

### **Migration Steps**
1. **Move contracts** to domain-level folders
2. **Update imports** in service modules
3. **Remove duplicates** from service-specific folders
4. **Test thoroughly** to ensure functionality

## 🎯 **Next Steps**

1. **Add search-discovery** to marketplace contracts
2. **Implement cross-domain communication** types in `libs/apitypes/`
3. **Create contract templates** for new domains
4. **Establish review processes** for contract changes
5. **Document domain-specific patterns** and best practices

## 📚 **Resources**

- [Domain-Driven Design Best Practices](./ddd-best-practices.md)
- [Domain Contracts Implementation Guide](./domain-contracts-implementation-guide.md)
- [DDD Migration Guide](./ddd-migration-guide.md) 