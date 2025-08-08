# Domain-Driven Design Migration Guide

## Overview

This guide outlines our comprehensive migration to Domain-Driven Design (DDD) architecture. We're transforming our monolithic structure into a clean, bounded context-based system with clear domain boundaries and type-safe communication.

## 🎯 **Migration Strategy: Unified Patterns**

We've decided to use **unified patterns** across the entire system:

- **Domain Contracts** for all inter-domain communication
- **Context Mappings** for all data translation between domains
- **No mixing** of direct gRPC calls with domain contracts

This ensures consistency, maintainability, and clear boundaries throughout the system.

---

## 📊 **Migration Status**

### ✅ **Phase 1: Domain Separation - COMPLETE**

**Status**: ✅ COMPLETE  
**Date**: Completed in previous iterations  
**Scope**: Initial domain separation and service boundaries

**Completed Tasks**:

- ✅ Separated services by business domains (marketplace, location-services, communication, infrastructure)
- ✅ Established clear domain boundaries
- ✅ Created domain-specific modules and services
- ✅ Implemented basic domain separation patterns

**Patterns Implemented**:

```typescript
// Domain configuration in bootstrap
const app = await BootstrapService.bootstrapNatsMicroservice({
	domain: 'marketplace', // Explicit domain declaration
	main: {
		module: VendorManagementModule,
		url: 'nats://localhost:4222',
	},
	health: {
		module: HealthModule,
		port: 3001,
	},
});
```

### ✅ **Phase 2: Event Schema Standardization - COMPLETE**

**Status**: ✅ COMPLETE  
**Date**: Completed in previous iterations  
**Scope**: Standardized event schemas and validation

**Completed Tasks**:

- ✅ Implemented Zod-based event schemas for type safety
- ✅ Created centralized `eventtypes` library for event management
- ✅ Standardized event validation patterns
- ✅ Established type-safe event emission
- ✅ Implemented unified event registry

**Patterns Implemented**:

```typescript
// Centralized event schemas
export const vendorEventSchemas = {
	'marketplace.vendor_onboarded': z.object({
		vendorId: z.string(),
		ownerId: z.string(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		timestamp: z.string().default(() => new Date().toISOString()),
	}) as const satisfies EnforceValidDomainEvents<'marketplace'>,
} as const;
```

### ✅ **Phase 3: Domain Events with Rich Context - COMPLETE**

**Status**: ✅ COMPLETE  
**Date**: December 2024  
**Scope**: Transition to domain events with automatic business context

**Completed Tasks**:

- ✅ **DDD Event Naming**: Migrated all events to domain-based naming (`marketplace.vendor_onboarded`, `location.vendor_location_updated`)
- ✅ **Automatic Context Extraction**: Enhanced `EventService` to automatically extract business identifiers from Zod schemas
- ✅ **Type-Based Validation**: Implemented compile-time validation for event patterns using TypeScript template literal types
- ✅ **Schema-Driven Business Context**: Events now automatically include relevant business identifiers (vendorId, userId, etc.)
- ✅ **Simplified API**: Maintained existing `eventService.emit()` pattern while adding automatic context
- ✅ **Event Structure Refactoring**: Updated `BaseEvent` to use `context`, `meta`, and `data` structure
- ✅ **Comprehensive Cleanup**: Removed theoretical/unused domains and schemas
- ✅ **Logging Standardization**: Fixed and standardized all logging patterns across the codebase

**Key Improvements**:

- **Event Naming**: `vendor.onboarded` → `marketplace.vendor.onboarded`
- **Automatic Context**: No more manual business context extraction
- **Type Safety**: Compile-time validation of event patterns
- **Cleaner Schemas**: Removed unused fields, added missing ones
- **Structured Logging**: All logs now include proper structured data and stack traces

**Patterns Implemented**:

```typescript
// Automatic context extraction
const event: BaseEvent = {
	context: {
		vendorId: data.vendorId,
		ownerId: data.ownerId,
	},
	meta: {
		eventId: randomUUID(),
		source: this.appName,
		timestamp: new Date().toISOString(),
		version: '1.0',
		correlationId: this.requestContextService?.getRequestId(),
		domain: 'marketplace',
		subdomain: 'vendor',
	},
	data: validatedData,
};
```

### ✅ **Phase 4: Bounded Contexts - IN PROGRESS**

**Status**: ✅ Week 1 Complete  
**Date**: December 2024  
**Scope**: Implement bounded context boundaries with context mappings and domain contracts

**Migration Strategy**: **Unified Patterns**

- **Domain Contracts** for all inter-domain communication
- **Context Mappings** for all data translation between domains
- **No mixing** of direct gRPC calls with domain contracts

**Completed Tasks**:

- ✅ **Define Bounded Contexts**: Established clear boundaries for each domain
- ✅ **Context Mapping Strategy**: Defined mapping between different bounded contexts
- ✅ **Domain Interface Contracts**: Defined explicit contracts between bounded contexts
- ✅ **Bounded Context Communication Guide**: Created comprehensive guide explaining why domain contracts are necessary
- ✅ **Context Mapping Reorganization**: Reorganized files to follow domain-specific patterns
- 🔲 **Context Mapping Implementation**: Implement mapping services and anti-corruption layers
- 🔲 **Domain Boundaries**: Establish explicit interfaces between domains
- 🔲 **Team Ownership**: Optimize domain structure for team scalability
- 🔲 **Integration Testing**: Validate context boundaries and interfaces
- 🔲 **Documentation**: Update team documentation and training materials

**Detailed Implementation Plan**:

#### ✅ **Week 1: Define Bounded Context Boundaries - COMPLETE**

- ✅ **Context Boundary Analysis**: Analyze current domain interactions and identify context boundaries
  - ✅ Document current domain structure and interactions
  - ✅ Identify shared concepts and context mappings
  - ✅ Create team ownership matrix for each bounded context
- ✅ **Context Mapping Strategy**: Define how concepts map between different bounded contexts
  - ✅ Establish translation patterns for cross-context communication
  - ✅ Define anti-corruption layer specifications
  - ✅ Create context mapping interfaces
- ✅ **Domain Interface Contracts**: Define explicit contracts between bounded contexts
  - ✅ Create domain interface definitions
  - ✅ Define contract schemas for cross-domain communication
  - ✅ Specify integration points

#### **Week 2: Implement Context Mapping**

- **Context Mapping Services**: Implement context mapping services for each domain
  - Create `MarketplaceLocationContextMapper` for vendor/user location translation
  - Create `MarketplaceCommunicationContextMapper` for external service integration
  - Create `LocationMarketplaceContextMapper` for business data translation
  - Implement efficient translation with minimal overhead (<5ms)
- **Anti-Corruption Layers**: Implement anti-corruption layers for external integrations
  - Create anti-corruption layer for Clerk webhook integrations
  - Create anti-corruption layer for RevenueCat webhook integrations
  - Implement external API translation patterns with type safety
  - Develop data transformation utilities with validation
- **Context Validation**: Implement validation for context boundaries
  - Create context boundary validation middleware using Zod schemas
  - Implement cross-context data validation with clear error messages
  - Add error handling for context violations with proper logging
  - Create validation utilities for contract compliance

#### **Week 3: Implement Domain Contracts**

- **Domain Contract Implementation**: Implement domain contract interfaces with gRPC
  - Create `LocationContractImpl` implementing `MarketplaceLocationContract`
  - Create `CommunicationContractImpl` implementing `MarketplaceCommunicationContract`
  - Create `InfrastructureContractImpl` implementing `MarketplaceInfrastructureContract`
  - Implement contract-level error handling and retry logic
- **Contract Testing**: Create comprehensive testing for all contracts
  - Write unit tests for contract implementations
  - Create integration tests for contract interactions
  - Implement contract-level metrics and monitoring
  - Add performance benchmarks for contract calls
- **Contract Documentation**: Document all contract interfaces and implementations
  - Create JSDoc documentation for all contract methods
  - Document error scenarios and handling
  - Create usage examples and best practices
  - Document performance characteristics and limitations

#### **Week 4: Testing & Validation**

- Write comprehensive tests for contracts and mappings
- Implement contract-level metrics and monitoring
- Validate performance and error handling

#### **Week 5: Documentation & Training**

- Create implementation guides
- Document best practices
- Train team on new patterns

#### **Week 6: Migration & Cleanup**

- Migrate existing services to use contracts
- Remove direct gRPC dependencies
- Clean up legacy code

**Success Metrics**:

**Technical Metrics**:

- **Contract Coverage**: 100% of inter-domain communication uses domain contracts
- **Type Safety**: 0 compile-time errors from contract violations
- **Test Coverage**: >90% coverage for all contracts and mappings
- **Performance**: <5ms overhead for contract translation
- **Error Rate**: <1% context-related errors in production

**Business Metrics**:

- **Development Velocity**: Faster feature development due to clear boundaries
- **Bug Reduction**: Fewer integration bugs due to type safety
- **Team Productivity**: Independent domain development without coordination overhead
- **Code Quality**: Consistent patterns reduce cognitive load and maintenance burden

**Risk Mitigation**:

**Technical Risks**:

- **Performance Overhead**: Monitor contract translation times and optimize
- **Complexity**: Start with simple contracts and evolve gradually
- **Breaking Changes**: Use semantic versioning for contracts

**Team Risks**:

- **Learning Curve**: Provide comprehensive training and examples
- **Resistance to Change**: Demonstrate clear benefits with metrics
- **Inconsistent Implementation**: Establish clear guidelines and code reviews

### ⏳ **Phase 5: Advanced DDD Patterns - PENDING**

**Status**: ⏳ PENDING  
**Date**: Not yet started  
**Scope**: Implement advanced DDD patterns for complex business logic

**Planned Tasks**:

- 🔲 **Aggregates**: Implement aggregate patterns for complex business entities
- 🔲 **Domain Repositories**: Add repository patterns for data access
- 🔲 **Value Objects**: Implement value objects for business concepts
- 🔲 **Domain Specifications**: Add specification patterns for complex queries
- 🔲 **Domain Services**: Enhance domain services with advanced patterns
- 🔲 **Event Sourcing**: Consider event sourcing for audit trails and business history

**Implementation Strategy**:

- **Week 1**: Identify candidates for aggregates and value objects
- **Week 2**: Implement aggregate patterns for vendor and user entities
- **Week 3**: Add domain repositories for data access patterns
- **Week 4**: Implement value objects for business concepts
- **Week 5**: Add domain specifications for complex queries
- **Week 6**: Consider event sourcing for audit trails

---

## 📋 **Making Domain Contracts & Context Mappings Manageable**

### **🎯 When to Use Domain Contracts**

**ALWAYS use domain contracts for:**

- ✅ **Inter-domain communication** (Marketplace ↔ Location Services)
- ✅ **Complex business logic** that spans multiple domains
- ✅ **External service integration** (Clerk, RevenueCat, Algolia)
- ✅ **Cross-cutting concerns** (file uploads, database operations)

**NEVER use direct gRPC for:**

- ❌ **Inter-domain communication** (creates tight coupling)
- ❌ **Business logic** (violates domain boundaries)
- ❌ **External integrations** (hard to test and maintain)

### **🔧 Implementation Guidelines**

#### **1. Keep Contracts Simple and Focused**

```typescript
// ✅ Good: Simple, focused contract
interface MarketplaceLocationContract {
	updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void>;
	getVendorLocation(vendorId: string): Promise<{ lat: number; lng: number } | null>;
	getVendorsInArea(bounds: LocationBounds): Promise<VendorLocation[]>;
}

// ❌ Bad: Overly complex contract
interface MarketplaceLocationContract {
	updateVendorLocation(vendorId: string, location: any, options?: any, metadata?: any): Promise<any>;
	getVendorLocation(vendorId: string, includeHistory?: boolean, accuracy?: number): Promise<any>;
	// ... 20 more methods
}
```

#### **2. Use Domain-Specific Validation**

```typescript
// ✅ Good: Focused validation methods
@Injectable()
export class LocationMarketplaceContextMapper {
	private validateLocationData(data: any): boolean {
		return data && 
			typeof data.latitude === 'number' &&
			typeof data.longitude === 'number' &&
			typeof data.timestamp === 'string';
	}

	toMarketplaceLocation(locationData: any) {
		if (!this.validateLocationData(locationData)) {
			throw new Error('Invalid location data');
		}

		return {
			lat: locationData.latitude,
			lng: locationData.longitude,
			timestamp: locationData.timestamp,
		};
	}
}

// ❌ Bad: Generic validation
@Injectable()
export class LocationMarketplaceContextMapper {
	validateData(data: any): boolean {
		return data && Object.keys(data).length > 0;
	}

	toMarketplaceLocation(locationData: any) {
		if (!this.validateData(locationData)) {
			throw new Error('Invalid data');
		}
		// Unsafe transformation...
	}
}
```

#### **3. Implement Simple Error Handling**

```typescript
// ✅ Good: Simple error handling with clear messages
@Injectable()
export class LocationMarketplaceContextMapper {
	private readonly logger = new Logger('LocationMarketplaceContextMapper');

	toMarketplaceLocation(locationData: any) {
		try {
			if (!this.validateLocationData(locationData)) {
				throw new Error('Invalid location data');
			}

			return {
				lat: locationData.latitude,
				lng: locationData.longitude,
				timestamp: locationData.timestamp,
			};
		} catch (error) {
			this.logger.error('Failed to translate location data', error);
			throw error;
		}
	}
}

// ❌ Bad: Complex error handling
@Injectable()
export class LocationMarketplaceContextMapper {
	toMarketplaceLocation(locationData: any) {
		this.logTranslationStart('toMarketplaceLocation', { data: locationData });
		try {
			this.validateSourceData(locationData);
			const result = this.transformData(locationData);
			this.validateTargetData(result);
			this.logTranslationSuccess('toMarketplaceLocation', result);
			return result;
		} catch (error) {
			this.logTranslationError('toMarketplaceLocation', error, locationData);
			throw this.createTransformationError(error, locationData);
		}
	}
}
```

### **📁 File Organization Strategy**

#### **Domain-Specific Organization**

```
apps/marketplace/contracts/
├── context-mappers/
│   ├── marketplace-location-context-mapper.ts    # Marketplace → Location
│   ├── marketplace-communication-context-mapper.ts # Marketplace → Communication
│   └── marketplace-infrastructure-context-mapper.ts # Marketplace → Infrastructure
├── anti-corruption-layers/
│   ├── clerk-anti-corruption-layer.ts    # Clerk → Marketplace
│   └── revenuecat-anti-corruption-layer.ts # RevenueCat → Marketplace
└── marketplace-contracts.module.ts        # Module exports

apps/location-services/contracts/
├── context-mappers/
│   └── location-marketplace-context-mapper.ts    # Location → Marketplace
├── anti-corruption-layers/
│   └── location-external-service-acl.ts    # External → Location
└── location-contracts.module.ts            # Module exports

apps/communication/contracts/
├── context-mappers/
│   └── communication-marketplace-context-mapper.ts # Communication → Marketplace
└── communication-contracts.module.ts       # Module exports

apps/infrastructure/contracts/
├── context-mappers/
│   └── infrastructure-marketplace-context-mapper.ts # Infrastructure → Marketplace
└── infrastructure-contracts.module.ts      # Module exports
```

#### **Implementation Organization**

```typescript
// ✅ Good: Simple context mapper
@Injectable()
export class LocationMarketplaceContextMapper {
	private readonly logger = new Logger('LocationMarketplaceContextMapper');

	// Private validation methods
	private validateLocationData(data: any): boolean {
		return data && 
			typeof data.latitude === 'number' &&
			typeof data.longitude === 'number' &&
			typeof data.timestamp === 'string';
	}

	// Public translation methods
	toMarketplaceLocation(locationData: any) {
		try {
			if (!this.validateLocationData(locationData)) {
				throw new Error('Invalid location data');
			}

			return {
				lat: locationData.latitude,
				lng: locationData.longitude,
				timestamp: locationData.timestamp,
			};
		} catch (error) {
			this.logger.error('Failed to translate location data', error);
			throw error;
		}
	}
}

// ✅ Good: Simple module
@Module({
	providers: [LocationMarketplaceContextMapper],
	exports: [LocationMarketplaceContextMapper],
})
export class LocationContractsModule {}
```

### **🧪 Testing Strategy**

#### **Context Mapper Testing**

```typescript
// Test the context mapper
describe('LocationMarketplaceContextMapper', () => {
	let mapper: LocationMarketplaceContextMapper;
	let mockLogger: jest.Mocked<Logger>;

	beforeEach(() => {
		mockLogger = { error: jest.fn() } as any;
		mapper = new LocationMarketplaceContextMapper();
		(mapper as any).logger = mockLogger;
	});

	describe('toMarketplaceLocation', () => {
		it('should transform valid location data', () => {
			// Arrange
			const locationData = {
				latitude: 40.7128,
				longitude: -74.006,
				timestamp: '2024-01-01T00:00:00Z',
			};

			// Act
			const result = mapper.toMarketplaceLocation(locationData);

			// Assert
			expect(result).toEqual({
				lat: 40.7128,
				lng: -74.006,
				timestamp: '2024-01-01T00:00:00Z',
			});
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		it('should throw error for invalid location data', () => {
			// Arrange
			const invalidData = {
				latitude: 'invalid',
				longitude: -74.006,
			};

			// Act & Assert
			expect(() => mapper.toMarketplaceLocation(invalidData)).toThrow('Invalid location data');
			expect(mockLogger.error).toHaveBeenCalledWith(
				'Failed to translate location data',
				expect.any(Error)
			);
		});
	});
});
```

#### **Anti-Corruption Layer Testing**

```typescript
// Test the anti-corruption layer
describe('LocationExternalServiceACL', () => {
	let acl: LocationExternalServiceACL;
	let mockLogger: jest.Mocked<Logger>;

	beforeEach(() => {
		mockLogger = { error: jest.fn() } as any;
		acl = new LocationExternalServiceACL();
		(acl as any).logger = mockLogger;
	});

	describe('toLocationServicesGeocodingResult', () => {
		it('should transform valid geocoding response', () => {
			// Arrange
			const externalResponse = {
				status: 'OK',
				results: [{
					formatted_address: '123 Main St',
					geometry: {
						location: { lat: 40.7128, lng: -74.006 },
					},
					place_id: 'place123',
				}],
			};

			// Act
			const result = acl.toLocationServicesGeocodingResult(externalResponse);

			// Assert
			expect(result).toEqual({
				address: '123 Main St',
				coordinates: {
					latitude: 40.7128,
					longitude: -74.006,
				},
				placeId: 'place123',
				timestamp: expect.any(String),
			});
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		it('should throw error for invalid response', () => {
			// Arrange
			const invalidResponse = {
				status: 'ERROR',
				results: [],
			};

			// Act & Assert
			expect(() => acl.toLocationServicesGeocodingResult(invalidResponse))
				.toThrow('Invalid geocoding response data');
			expect(mockLogger.error).toHaveBeenCalledWith(
				'Failed to translate geocoding result',
				expect.any(Error)
			);
		});
	});
});
```

### **🚀 Performance Considerations**

#### **1. Minimize Translation Overhead**

```typescript
// ✅ Good: Efficient translation
@Injectable()
export class MarketplaceLocationContextMapper {
	toGrpcRequest(vendorId: string, location: { lat: number; lng: number }) {
		return {
			entityId: vendorId,
			coordinates: location, // Direct assignment, no deep cloning
			trackingStatus: 'active',
			timestamp: new Date().toISOString(),
		};
	}
}

// ❌ Bad: Expensive translation
@Injectable()
export class MarketplaceLocationContextMapper {
	toGrpcRequest(vendorId: string, location: any) {
		return {
			entityId: vendorId,
			coordinates: JSON.parse(JSON.stringify(location)), // Expensive deep clone
			trackingStatus: 'active',
			timestamp: new Date().toISOString(),
			metadata: this.generateComplexMetadata(location), // Expensive operation
			validation: this.validateLocation(location), // Expensive validation
		};
	}
}
```

#### **2. Use Connection Pooling**

```typescript
// ✅ Good: Reuse gRPC connections
@Injectable()
export class LocationContractImpl implements MarketplaceLocationContract {
	constructor(
		private locationGrpcClient: LocationServiceClient, // Injected, reused
		private contextMapper: MarketplaceLocationContextMapper,
	) {}

	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void> {
		const request = this.contextMapper.toGrpcRequest(vendorId, location);
		await this.locationGrpcClient.updateLocation(request); // Reuses connection
	}
}
```

### **📊 Monitoring and Observability**

#### **Contract-Level Metrics**

```typescript
@Injectable()
export class LocationContractImpl implements MarketplaceLocationContract {
	constructor(
		private locationGrpcClient: LocationServiceClient,
		private contextMapper: MarketplaceLocationContextMapper,
		private metricsService: MetricsService,
	) {}

	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void> {
		const startTime = Date.now();

		try {
			const request = this.contextMapper.toGrpcRequest(vendorId, location);
			await this.locationGrpcClient.updateLocation(request);

			// Record success metrics
			this.metricsService.recordContractCall('marketplace.location.updateVendorLocation', {
				success: true,
				duration: Date.now() - startTime,
			});
		} catch (error) {
			// Record error metrics
			this.metricsService.recordContractCall('marketplace.location.updateVendorLocation', {
				success: false,
				duration: Date.now() - startTime,
				error: error.message,
			});
			throw error;
		}
	}
}
```

---

## 🎯 **Key Benefits of This Approach**

### **1. Unified Patterns**

- **Consistency**: Same patterns across all domains
- **Predictability**: Developers know what to expect
- **Maintainability**: Easier to understand and modify

### **2. Clear Boundaries**

- **Domain Ownership**: Each domain owns its data and logic
- **Independent Evolution**: Domains can change without affecting others
- **Team Autonomy**: Teams can work independently

### **3. Type Safety**

- **Compile-Time Validation**: Catch errors before runtime
- **IntelliSense Support**: Better developer experience
- **Refactoring Safety**: Safe to change contract implementations

### **4. Testability**

- **Easy Mocking**: Mock contracts instead of entire services
- **Isolated Testing**: Test domains independently
- **Clear Test Boundaries**: Know exactly what to test

### **5. Performance**

- **Connection Reuse**: Efficient gRPC connection pooling
- **Minimal Overhead**: Optimized translation and validation
- **Monitoring**: Clear metrics for performance tracking

---

## 📚 **Implementation Resources**

### **Documentation**

- [Domain Contracts Guide](./domain-contracts-guide.md) - Detailed guide on contracts and mappings
- [DDD Best Practices](./ddd-best-practices.md) - General DDD patterns

### **Code Examples**

- `libs/apitypes/src/domains/` - Contract and mapping type definitions
- `apps/marketplace/src/contracts/` - Contract implementations
- `test/contracts/` - Contract testing examples

### **Tools and Libraries**

- **TypeScript**: For type safety and compile-time validation
- **Zod**: For schema validation and context mapping
- **gRPC**: For efficient inter-service communication
- **NATS**: For event-driven communication
- **Jest**: For contract and mapping testing

---

## 🚀 **Next Steps**

1. **Review Week 1 Deliverables**: Ensure all boundaries and contracts are properly defined
2. **Begin Week 2**: Start implementing context mapping services
3. **Set Up Monitoring**: Implement contract-level metrics and observability
4. **Train Team**: Ensure all developers understand the new patterns
5. **Plan Migration**: Prepare for gradual migration of existing services

This unified approach ensures we have consistent, maintainable, and type-safe communication between all domains while keeping the implementation manageable and performant.
