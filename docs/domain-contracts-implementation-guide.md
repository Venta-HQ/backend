# Domain Contracts Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing domain contracts across all domains using the shared libraries and utilities we've created.

## 🏗️ **Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  (Domain Services using Domain Contracts)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Domain Contracts Layer                    │
│  (Type-safe interfaces between domains)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 Context Mapping Layer                       │
│  (Data translation between domain formats)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Transport Layer                          │
│  (gRPC, HTTP, WebSockets)                                  │
└─────────────────────────────────────────────────────────────┘
```

## 📋 **Implementation Checklist**

### **Phase 1: Shared Libraries ✅ COMPLETE**
- ✅ Base classes created (`BaseContextMapper`, `BaseAntiCorruptionLayer`)
- ✅ Registration service created (`ContractRegistrationService`)
- ✅ Factory service created (`ContractFactoryService`)
- ✅ Contracts module created (`ContractsModule`)

### **Phase 2: Domain Implementation (In Progress)**
- 🔲 **Marketplace Domain**
  - 🔲 user-management (partially complete)
  - 🔲 vendor-management
  - 🔲 search-discovery
- 🔲 **Location Services Domain**
  - 🔲 geolocation
  - 🔲 real-time
- 🔲 **Communication Domain**
  - 🔲 webhooks
- 🔲 **Infrastructure Domain**
  - 🔲 api-gateway
  - 🔲 file-management

## 🚀 **Implementation Steps for Each Domain**

### **Step 1: Create Domain-Specific Context Mappers**

Extend `BaseContextMapper` for each domain interaction:

```typescript
// apps/marketplace/vendor-management/src/contracts/context-mappers/vendor-location-context-mapper.ts
import { BaseContextMapper } from '@app/nest/modules/contracts';

export class VendorLocationContextMapper extends BaseContextMapper {
  constructor() {
    super('VendorLocationContextMapper');
  }

  getDomain(): string {
    return 'marketplace';
  }

  getTargetDomain(): string {
    return 'location-services';
  }

  validateSourceData(data: any): boolean {
    // Implement domain-specific validation
    return this.validateLocation(data.location);
  }

  validateTargetData(data: any): boolean {
    // Implement target domain validation
    return this.validateLocationServicesResponse(data);
  }

  // Domain-specific translation methods
  toLocationServicesVendorUpdate(vendorId: string, location: { lat: number; lng: number }) {
    this.logTranslationStart('toLocationServicesVendorUpdate', { vendorId, location });
    
    try {
      if (!this.validateSourceData({ location })) {
        throw this.createValidationError('Invalid vendor location data', { vendorId, location });
      }

      const result = {
        entityId: vendorId,
        coordinates: this.transformLocationToLatLng(location),
        trackingStatus: 'active',
        accuracy: 5.0,
        lastUpdateTime: new Date().toISOString(),
        source: 'marketplace',
      };

      this.logTranslationSuccess('toLocationServicesVendorUpdate', result);
      return result;
    } catch (error) {
      this.logTranslationError('toLocationServicesVendorUpdate', error, { vendorId, location });
      throw error;
    }
  }
}
```

### **Step 2: Create Domain-Specific Anti-Corruption Layers**

Extend `BaseAntiCorruptionLayer` for external service integrations:

```typescript
// apps/marketplace/vendor-management/src/contracts/anti-corruption-layers/vendor-clerk-anti-corruption-layer.ts
import { BaseAntiCorruptionLayer } from '@app/nest/modules/contracts';

export class VendorClerkAntiCorruptionLayer extends BaseAntiCorruptionLayer {
  constructor() {
    super('VendorClerkAntiCorruptionLayer');
  }

  getExternalService(): string {
    return 'clerk';
  }

  getDomain(): string {
    return 'marketplace';
  }

  validateExternalData(data: any): boolean {
    return this.validateExternalUser(data);
  }

  validateMarketplaceData(data: any): boolean {
    return this.validateMarketplaceUser(data);
  }

  // Domain-specific translation methods
  toMarketplaceVendor(clerkUser: any) {
    this.logTranslationStart('toMarketplaceVendor', { clerkUserId: clerkUser?.id });
    
    try {
      if (!this.validateExternalData(clerkUser)) {
        throw this.createValidationError('Invalid Clerk user data', { clerkUser });
      }

      const result = {
        clerkId: clerkUser.id,
        email: this.extractEmail(clerkUser),
        firstName: this.extractFirstName(clerkUser),
        lastName: this.extractLastName(clerkUser),
        metadata: this.extractMetadata(clerkUser),
        createdAt: this.extractCreatedAt(clerkUser),
        updatedAt: this.extractUpdatedAt(clerkUser),
      };

      this.logTranslationSuccess('toMarketplaceVendor', result);
      return result;
    } catch (error) {
      this.logTranslationError('toMarketplaceVendor', error, { clerkUser });
      throw error;
    }
  }
}
```

### **Step 3: Create Domain Contract Implementations**

Implement domain contracts using context mappers and gRPC:

```typescript
// apps/marketplace/vendor-management/src/contracts/implementations/vendor-location-contract-impl.ts
import { Injectable } from '@nestjs/common';
import { MarketplaceLocationContract } from '@app/apitypes/domains/marketplace';
import { VendorLocationContextMapper } from '../context-mappers/vendor-location-context-mapper';
import { LocationServiceClient } from '@app/proto/location-services';

@Injectable()
export class VendorLocationContractImpl implements MarketplaceLocationContract {
  constructor(
    private readonly contextMapper: VendorLocationContextMapper,
    private readonly locationGrpcClient: LocationServiceClient,
  ) {}

  async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void> {
    // 1. Translate using context mapping
    const grpcRequest = this.contextMapper.toLocationServicesVendorUpdate(vendorId, location);
    
    // 2. Call gRPC service
    await this.locationGrpcClient.updateLocation(grpcRequest);
  }

  async getVendorLocation(vendorId: string): Promise<{ lat: number; lng: number } | null> {
    // 1. Call gRPC service
    const grpcResponse = await this.locationGrpcClient.getLocation({ entityId: vendorId });
    
    // 2. Translate response using context mapping
    if (!grpcResponse || !grpcResponse.coordinates) {
      return null;
    }

    return this.contextMapper.toMarketplaceVendorLocation(grpcResponse);
  }

  // ... implement other contract methods
}
```

### **Step 4: Setup Domain Contract Infrastructure**

Use the factory service to setup all components:

```typescript
// apps/marketplace/vendor-management/src/contracts/vendor-contracts.module.ts
import { Module } from '@nestjs/common';
import { ContractsModule, ContractFactoryService } from '@app/nest/modules/contracts';
import { VendorLocationContextMapper } from './context-mappers/vendor-location-context-mapper';
import { VendorClerkAntiCorruptionLayer } from './anti-corruption-layers/vendor-clerk-anti-corruption-layer';
import { VendorLocationContractImpl } from './implementations/vendor-location-contract-impl';

@Module({
  imports: [ContractsModule],
  providers: [
    // Context Mappers
    VendorLocationContextMapper,
    
    // Anti-Corruption Layers
    VendorClerkAntiCorruptionLayer,
    
    // Contract Implementations
    VendorLocationContractImpl,
    
    // Factory Service for setup
    {
      provide: 'VENDOR_CONTRACTS_SETUP',
      useFactory: (factoryService: ContractFactoryService) => {
        return factoryService.setupDomainContracts({
          domain: 'marketplace',
          contextMappers: [
            { class: VendorLocationContextMapper },
          ],
          antiCorruptionLayers: [
            { class: VendorClerkAntiCorruptionLayer },
          ],
          contracts: [
            { 
              name: 'MarketplaceLocationContract',
              class: VendorLocationContractImpl,
              args: [/* dependencies */]
            },
          ],
        });
      },
      inject: [ContractFactoryService],
    },
  ],
  exports: [
    VendorLocationContextMapper,
    VendorClerkAntiCorruptionLayer,
    VendorLocationContractImpl,
  ],
})
export class VendorContractsModule {}
```

### **Step 5: Update Domain Services**

Replace direct gRPC calls with domain contracts:

```typescript
// apps/marketplace/vendor-management/src/core/vendor.service.ts
import { Injectable } from '@nestjs/common';
import { MarketplaceLocationContract } from '@app/apitypes/domains/marketplace';

@Injectable()
export class VendorService {
  constructor(
    private readonly locationContract: MarketplaceLocationContract, // Use contract instead of gRPC
  ) {}

  async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }) {
    // Business logic
    await this.validateVendorExists(vendorId);
    
    // Use domain contract instead of direct gRPC
    await this.locationContract.updateVendorLocation(vendorId, location);
    
    // Emit domain event
    await this.eventService.emit('marketplace.vendor.location_updated', {
      vendorId,
      location,
    });
  }
}
```

## 📊 **Domain Implementation Matrix**

| Domain | Service | Context Mappers | Anti-Corruption Layers | Contracts | Status |
|--------|---------|-----------------|------------------------|-----------|---------|
| **Marketplace** | user-management | ✅ Location, Communication, Infrastructure | ✅ Clerk, RevenueCat | 🔲 Location, Communication, Infrastructure | 🔲 In Progress |
| **Marketplace** | vendor-management | 🔲 Location, Communication, Infrastructure | 🔲 Clerk, RevenueCat | 🔲 Location, Communication, Infrastructure | 🔲 Pending |
| **Marketplace** | search-discovery | 🔲 Location, Communication, Infrastructure | 🔲 Algolia | 🔲 Location, Communication, Infrastructure | 🔲 Pending |
| **Location Services** | geolocation | 🔲 Marketplace | 🔲 None | 🔲 Marketplace | 🔲 Pending |
| **Location Services** | real-time | 🔲 Marketplace | 🔲 None | 🔲 Marketplace | 🔲 Pending |
| **Communication** | webhooks | 🔲 Marketplace | 🔲 Clerk, RevenueCat | 🔲 Marketplace | 🔲 Pending |
| **Infrastructure** | api-gateway | 🔲 All domains | 🔲 None | 🔲 All domains | 🔲 Pending |
| **Infrastructure** | file-management | 🔲 All domains | 🔲 None | 🔲 All domains | 🔲 Pending |

## 🎯 **Next Steps**

1. **Complete user-management domain** using shared libraries
2. **Implement vendor-management domain** following the same patterns
3. **Implement search-discovery domain** with Algolia integration
4. **Implement location-services domain** with marketplace contracts
5. **Implement communication domain** with webhook handling
6. **Implement infrastructure domain** with file and API management

## 🔧 **Testing Strategy**

### **Unit Tests**
```typescript
describe('VendorLocationContextMapper', () => {
  let mapper: VendorLocationContextMapper;

  beforeEach(() => {
    mapper = new VendorLocationContextMapper();
  });

  it('should translate marketplace location to location services format', () => {
    const result = mapper.toLocationServicesVendorUpdate('vendor-123', { lat: 40.7128, lng: -74.006 });
    
    expect(result.entityId).toBe('vendor-123');
    expect(result.coordinates.latitude).toBe(40.7128);
    expect(result.coordinates.longitude).toBe(-74.006);
  });
});
```

### **Integration Tests**
```typescript
describe('VendorLocationContractImpl', () => {
  let contract: VendorLocationContractImpl;
  let mockLocationGrpcClient: jest.Mocked<LocationServiceClient>;

  beforeEach(() => {
    mockLocationGrpcClient = createMockLocationServiceClient();
    contract = new VendorLocationContractImpl(
      new VendorLocationContextMapper(),
      mockLocationGrpcClient,
    );
  });

  it('should update vendor location through contract', async () => {
    await contract.updateVendorLocation('vendor-123', { lat: 40.7128, lng: -74.006 });
    
    expect(mockLocationGrpcClient.updateLocation).toHaveBeenCalledWith({
      entityId: 'vendor-123',
      coordinates: { latitude: 40.7128, longitude: -74.006 },
      trackingStatus: 'active',
      accuracy: 5.0,
      lastUpdateTime: expect.any(String),
      source: 'marketplace',
    });
  });
});
```

## 📈 **Success Metrics**

- **Contract Coverage**: 100% of inter-domain communication uses domain contracts
- **Type Safety**: 0 compile-time errors from contract violations
- **Test Coverage**: >90% coverage for all contracts and mappings
- **Performance**: <5ms overhead for contract translation
- **Error Rate**: <1% context-related errors in production

## 🚨 **Common Pitfalls to Avoid**

1. **Don't mix direct gRPC calls with domain contracts**
2. **Don't skip validation in context mappers**
3. **Don't forget to register components with the factory service**
4. **Don't implement business logic in anti-corruption layers**
5. **Don't forget to emit domain events after contract calls**

## 📚 **Resources**

- [Domain Contracts Guide](./domain-contracts-guide.md) - Detailed guide on contracts and mappings
- [DDD Migration Guide](./ddd-migration-guide.md) - Complete migration strategy
- [Shared Libraries Documentation](../../libs/nest/modules/contracts/) - Base classes and utilities 