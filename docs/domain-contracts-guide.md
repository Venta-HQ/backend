# Domain Contracts & Context Mapping Guide

## Overview

This guide explains our unified approach to domain contracts and context mappings in Domain-Driven Design (DDD). We use **consistent patterns** throughout the system to ensure maintainability, type safety, and clear domain boundaries.

## 🎯 **Why Domain Contracts?**

### **The Problem with Direct gRPC**

When you use direct gRPC calls between domains, you create:

- **Tight Coupling**: Domains know each other's internal details
- **Breaking Changes**: Changes in one domain break others
- **Mixed Concerns**: Business logic mixed with transport details
- **Hard to Test**: Need to mock entire services

### **The Solution: Domain Contracts**

We use **domain contracts for ALL inter-domain communication**:

- ✅ **Loose Coupling**: Domains only depend on contracts, not implementations
- ✅ **Type Safety**: Compile-time validation of communication
- ✅ **Clear Boundaries**: Each domain owns its own data and logic
- ✅ **Easy Testing**: Mock contracts, not entire services
- ✅ **Independent Evolution**: Domains can change internally without affecting others

---

## 🏗️ **Architecture Overview**

### **Communication Layers**

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

### **gRPC vs Domain Contracts: Different Layers**

#### **gRPC (Transport Layer)**

```typescript
// gRPC handles HOW we communicate
service LocationService {
  rpc UpdateVendorLocation(UpdateLocationRequest) returns (UpdateLocationResponse);
  rpc GetVendorLocation(GetLocationRequest) returns (GetLocationResponse);
}

// This is about network communication, serialization, etc.
```

#### **Domain Contracts (Business Layer)**

```typescript
// Domain contracts handle WHAT we communicate
interface MarketplaceLocationContract {
	updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void>;
	getVendorLocation(vendorId: string): Promise<{ lat: number; lng: number } | null>;
}

// This is about business semantics, domain boundaries, etc.
```

---

## 🚨 **Real-World Problems Domain Contracts Solve**

### **Problem 1: Tight Coupling with Direct gRPC**

#### **Without Domain Contracts (Just gRPC)**

```typescript
// ❌ Direct gRPC call - tight coupling
@Injectable()
export class VendorService {
	constructor(
		private locationGrpcClient: LocationServiceClient, // Direct gRPC dependency
	) {}

	async updateVendorLocation(vendorId: string, location: any) {
		// Marketplace knows Location Services' internal structure
		const request = {
			entityId: vendorId, // Location Services' field name
			coordinates: location, // Location Services' data structure
			trackingStatus: 'active', // Location Services' business logic
			accuracy: 5.0, // Location Services' internal details
			lastUpdateTime: new Date().toISOString(),
		};

		await this.locationGrpcClient.updateLocation(request);
	}
}
```

**Problems:**

- **Tight Coupling**: Marketplace knows Location Services' internal field names
- **Breaking Changes**: If Location Services changes its protobuf, Marketplace breaks
- **Mixed Concerns**: Business logic mixed with transport details
- **Hard to Test**: Need to mock entire gRPC service

#### **With Domain Contracts + gRPC**

```typescript
// ✅ Clean separation - business logic separate from transport
@Injectable()
export class VendorService {
	constructor(
		private locationContract: MarketplaceLocationContract, // Business contract
	) {}

	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }) {
		// Marketplace only knows business semantics
		await this.locationContract.updateVendorLocation(vendorId, location);
	}
}

// Implementation handles the gRPC details
@Injectable()
export class LocationContractImpl implements MarketplaceLocationContract {
	constructor(private locationGrpcClient: LocationServiceClient) {}

	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }) {
		// Contract implementation handles the translation
		const request = this.translateToGrpcRequest(vendorId, location);
		await this.locationGrpcClient.updateLocation(request);
	}

	private translateToGrpcRequest(vendorId: string, location: { lat: number; lng: number }) {
		return {
			entityId: vendorId,
			coordinates: location,
			trackingStatus: 'active',
			accuracy: 5.0,
			lastUpdateTime: new Date().toISOString(),
		};
	}
}
```

### **Problem 2: Independent Domain Evolution**

#### **Scenario: Location Services Changes Internal Structure**

#### **Without Domain Contracts**

```typescript
// Location Services changes its protobuf
message UpdateLocationRequest {
  string vendor_id = 1;        // Changed from entityId
  LocationData location = 2;   // Changed from coordinates
  // ... other changes
}

// ❌ Marketplace breaks immediately - needs to update all calls
@Injectable()
export class VendorService {
	async updateVendorLocation(vendorId: string, location: any) {
		const request = {
			vendor_id: vendorId, // Had to change this
			location: {
				// Had to change this
				lat: location.lat,
				lng: location.lng,
			},
		};
		await this.locationGrpcClient.updateLocation(request);
	}
}
```

#### **With Domain Contracts**

```typescript
// ✅ Marketplace doesn't change at all!
@Injectable()
export class VendorService {
	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }) {
		// This stays exactly the same
		await this.locationContract.updateVendorLocation(vendorId, location);
	}
}

// Only the contract implementation changes
@Injectable()
export class LocationContractImpl implements MarketplaceLocationContract {
	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }) {
		// Contract implementation adapts to the new protobuf
		const request = {
			vendor_id: vendorId, // Updated to match new protobuf
			location: {
				// Updated to match new protobuf
				lat: location.lat,
				lng: location.lng,
			},
		};
		await this.locationGrpcClient.updateLocation(request);
	}
}
```

---

## 🗺️ **Context Mappings: Data Translation**

### **What Are Context Mappings?**

Context mappings are **translators** that convert data from one domain's format to another domain's format. They ensure that each domain can work with data in its own "language" while still communicating with other domains.

### **Real-World Example: Vendor Location**

Let's say a vendor updates their location. Here's how different domains think about this:

#### **Marketplace Domain** (Business Focus)

```typescript
// Marketplace thinks of a vendor as a business entity
interface MarketplaceVendor {
	id: string; // "vendor-123"
	name: string; // "Joe's Pizza"
	description: string; // "Best pizza in town"
	email: string; // "joe@pizza.com"
	phone: string; // "+1-555-1234"
	isActive: boolean; // true
	// ... business data
}
```

#### **Location Services Domain** (Geospatial Focus)

```typescript
// Location Services thinks of a vendor as a location entity
interface LocationVendor {
	entityId: string; // "vendor-123" (same ID, different name)
	coordinates: {
		// Location data
		lat: number;
		lng: number;
	};
	trackingStatus: 'active' | 'inactive' | 'suspended';
	lastUpdateTime: string;
	accuracy: number; // GPS accuracy in meters
	// ... location data
}
```

#### **Context Mapping** (Translation Layer)

```typescript
// Context mapping translates between the two understandings
interface MarketplaceLocationMapping {
	vendorLocation: {
		marketplaceVendorId: string; // "vendor-123" (Marketplace's ID)
		locationCoordinates: {
			// Only the location data Location Services needs
			lat: number;
			lng: number;
		};
		locationDomain: 'vendor_location'; // Context identifier
		timestamp: string;
	};
}
```

### **How Context Mapping Works**

```typescript
// When marketplace needs to update vendor location:
const marketplaceVendor = {
	id: 'vendor-123',
	name: "Joe's Pizza",
	description: 'Best pizza in town',
	location: { lat: 40.7128, lng: -74.006 }, // New location
};

// Context mapping translates it:
const locationData = {
	marketplaceVendorId: 'vendor-123', // Keep the ID for reference
	locationCoordinates: { lat: 40.7128, lng: -74.006 }, // Only location data
	locationDomain: 'vendor_location',
	timestamp: new Date().toISOString(),
};

// Now Location Services can work with this data in its own format
```

---

## 📋 **Domain Contracts: Service Interfaces**

### **What Are Domain Contracts?**

Domain contracts are **service interfaces** that define how domains can call each other's services. They provide a clear, type-safe way for domains to communicate without knowing each other's internal details.

### **Real-World Example: Vendor Location Update**

#### **Marketplace → Location Services Contract**

```typescript
// Marketplace can call these methods on Location Services:
interface MarketplaceLocationContract {
	// Update vendor location
	updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void>;

	// Get vendor's current location
	getVendorLocation(vendorId: string): Promise<{ lat: number; lng: number } | null>;

	// Find vendors in a geographic area
	getVendorsInArea(bounds: LocationBounds): Promise<VendorLocation[]>;

	// Subscribe to real-time location updates
	subscribeToVendorLocation(vendorId: string): Observable<LocationUpdate>;
}
```

#### **Location Services → Marketplace Contract**

```typescript
// Location Services can call these methods on Marketplace:
interface LocationMarketplaceContract {
	// Get vendor business data (for display purposes)
	getVendorBusinessData(vendorId: string): Promise<{
		id: string;
		name: string;
		description?: string;
		isActive: boolean;
	} | null>;

	// Notify marketplace of location changes
	notifyVendorLocationChanged(vendorId: string, location: { lat: number; lng: number }): Promise<void>;
}
```

### **How Domain Contracts Work**

```typescript
// Marketplace service using the contract:
@Injectable()
export class VendorService {
	constructor(
		private locationContract: MarketplaceLocationContract, // Inject the contract
	) {}

	async updateVendorLocation(vendorId: string, newLocation: { lat: number; lng: number }) {
		// 1. Update business data in marketplace
		await this.updateVendorBusinessData(vendorId, { location: newLocation });

		// 2. Call location services through the contract
		await this.locationContract.updateVendorLocation(vendorId, newLocation);

		// 3. Emit marketplace event
		await this.eventService.emit('marketplace.vendor.location_updated', {
			vendorId,
			location: newLocation,
		});
	}
}

// Location Services using the contract:
@Injectable()
export class LocationService {
	constructor(
		private marketplaceContract: LocationMarketplaceContract, // Inject the contract
	) {}

	async handleLocationUpdate(vendorId: string, location: { lat: number; lng: number }) {
		// 1. Update location data
		await this.updateLocationData(vendorId, location);

		// 2. Notify marketplace through the contract
		await this.marketplaceContract.notifyVendorLocationChanged(vendorId, location);

		// 3. Emit location event
		await this.eventService.emit('location.vendor.location_updated', {
			vendorId,
			location,
		});
	}
}
```

---

## 🔄 **Complete Example: Vendor Location Update Flow**

Let's trace through a complete vendor location update:

### **1. User Updates Vendor Location (Frontend)**

```typescript
// Frontend sends update to Marketplace API
POST /api/vendors/vendor-123/location
{
  "lat": 40.7128,
  "lng": -74.0060
}
```

### **2. Marketplace Processes Update**

```typescript
@Controller('vendors')
export class VendorController {
	constructor(
		private vendorService: VendorService,
		private locationContract: MarketplaceLocationContract,
	) {}

	@Post(':id/location')
	async updateVendorLocation(@Param('id') vendorId: string, @Body() location: { lat: number; lng: number }) {
		// 1. Validate vendor exists and user has permission
		const vendor = await this.vendorService.getVendor(vendorId);

		// 2. Update vendor business data
		await this.vendorService.updateVendor(vendorId, { location });

		// 3. Call Location Services through contract
		await this.locationContract.updateVendorLocation(vendorId, location);

		return { success: true };
	}
}
```

### **3. Context Mapping Translation**

```typescript
// Context mapping service translates the data
@Injectable()
export class MarketplaceLocationContextMapper {
	translateVendorLocationUpdate(
		marketplaceVendor: MarketplaceVendor,
		newLocation: { lat: number; lng: number },
	): MarketplaceLocationMapping {
		return {
			vendorLocation: {
				marketplaceVendorId: marketplaceVendor.id,
				locationCoordinates: newLocation,
				locationDomain: 'vendor_location',
				timestamp: new Date().toISOString(),
			},
		};
	}
}
```

### **4. Location Services Processes Update**

```typescript
@Injectable()
export class LocationService {
	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }) {
		// 1. Update location in database
		await this.locationRepository.updateLocation(vendorId, location);

		// 2. Update location in Redis for real-time queries
		await this.redis.geoadd('vendor_locations', location.lng, location.lat, vendorId);

		// 3. Notify real-time subscribers
		await this.notifyLocationSubscribers(vendorId, location);

		// 4. Emit location event
		await this.eventService.emit('location.vendor.location_updated', {
			vendorId,
			location,
			timestamp: new Date().toISOString(),
		});
	}
}
```

### **5. Real-Time Updates**

```typescript
// Users tracking this vendor get real-time updates
@WebSocketGateway('/location')
export class LocationGateway {
	@SubscribeMessage('trackVendor')
	async trackVendor(socket: Socket, vendorId: string) {
		// Join vendor's location room
		socket.join(`vendor-${vendorId}`);

		// Send current location
		const location = await this.locationService.getVendorLocation(vendorId);
		socket.emit('vendorLocation', { vendorId, location });
	}

	// When location updates, notify all subscribers
	async notifyLocationSubscribers(vendorId: string, location: { lat: number; lng: number }) {
		this.server.to(`vendor-${vendorId}`).emit('vendorLocationUpdated', {
			vendorId,
			location,
			timestamp: new Date().toISOString(),
		});
	}
}
```

---

## 📋 **Implementation Guidelines**

### **🎯 When to Use Domain Contracts**

**ALWAYS use domain contracts for:**

- ✅ **Inter-domain communication** (Marketplace ↔ Location Services)
- ✅ **External service integration** (Clerk, RevenueCat, Algolia)
- ✅ **Cross-cutting concerns** (file uploads, database operations)
- ✅ **Complex business logic** that spans multiple domains

**NEVER use direct gRPC for:**

- ❌ **Inter-domain communication** (creates tight coupling)
- ❌ **Business logic** (violates domain boundaries)
- ❌ **External integrations** (hard to test and maintain)

### **🔧 Contract Design Principles**

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

#### **2. Use Domain-Specific Naming**

```typescript
// ✅ Good: Domain-specific names
interface MarketplaceLocationContract {
	updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void>;
}

interface LocationMarketplaceContract {
	getVendorBusinessData(vendorId: string): Promise<VendorBusinessData | null>;
}

// ❌ Bad: Generic names
interface LocationContract {
	updateLocation(entityId: string, coordinates: any): Promise<void>;
}
```

#### **3. Implement Efficient Context Mapping**

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

---

## 📁 **File Organization**

### **Type Definitions**

```
libs/apitypes/src/domains/
├── marketplace/
│   ├── context-mapping.types.ts    # Marketplace → Other domains
│   ├── domain-contracts.types.ts   # What Marketplace can call
│   └── index.ts                    # Clean exports
├── location-services/
│   ├── context-mapping.types.ts    # Location → Other domains
│   ├── domain-contracts.types.ts   # What Location can call
│   └── index.ts                    # Clean exports
└── communication/
    ├── context-mapping.types.ts    # Communication → Other domains
    ├── domain-contracts.types.ts   # What Communication can call
    └── index.ts                    # Clean exports
```

### **Implementation**

```
apps/marketplace/src/
├── contracts/
│   ├── location/
│   │   ├── location-contract.impl.ts    # Implements MarketplaceLocationContract
│   │   └── location-context-mapper.ts   # Translates data
│   └── communication/
│       ├── communication-contract.impl.ts
│       └── communication-context-mapper.ts
└── services/
    └── vendor.service.ts              # Uses contracts
```

---

## 🧪 **Testing Strategy**

### **Contract Testing**

```typescript
// Test the contract implementation
describe('LocationContractImpl', () => {
	let contract: MarketplaceLocationContract;
	let mockGrpcClient: jest.Mocked<LocationServiceClient>;
	let mockContextMapper: jest.Mocked<MarketplaceLocationContextMapper>;

	beforeEach(() => {
		mockGrpcClient = createMockGrpcClient();
		mockContextMapper = createMockContextMapper();
		contract = new LocationContractImpl(mockGrpcClient, mockContextMapper);
	});

	it('should update vendor location', async () => {
		// Arrange
		const vendorId = 'vendor-123';
		const location = { lat: 40.7128, lng: -74.006 };
		const grpcRequest = { entityId: vendorId, coordinates: location };

		mockContextMapper.toGrpcRequest.mockReturnValue(grpcRequest);
		mockGrpcClient.updateLocation.mockResolvedValue({});

		// Act
		await contract.updateVendorLocation(vendorId, location);

		// Assert
		expect(mockContextMapper.toGrpcRequest).toHaveBeenCalledWith(vendorId, location);
		expect(mockGrpcClient.updateLocation).toHaveBeenCalledWith(grpcRequest);
	});
});
```

### **Service Testing**

```typescript
// Test the service using the contract
describe('VendorService', () => {
	let service: VendorService;
	let mockLocationContract: jest.Mocked<MarketplaceLocationContract>;

	beforeEach(() => {
		mockLocationContract = createMockLocationContract();
		service = new VendorService(mockLocationContract);
	});

	it('should update vendor location through contract', async () => {
		// Arrange
		const vendorId = 'vendor-123';
		const location = { lat: 40.7128, lng: -74.006 };

		// Act
		await service.updateVendorLocation(vendorId, location);

		// Assert
		expect(mockLocationContract.updateVendorLocation).toHaveBeenCalledWith(vendorId, location);
	});
});
```

---

## 📊 **Performance Considerations**

### **1. Minimize Translation Overhead**

- **Direct Assignment**: Use direct property assignment instead of deep cloning
- **Lazy Evaluation**: Only translate data when needed
- **Caching**: Cache frequently used translations
- **Connection Pooling**: Reuse gRPC connections

### **2. Monitor Performance**

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

## 🎯 **Success Metrics**

### **Technical Metrics**

- **Contract Coverage**: 100% of inter-domain communication uses contracts
- **Type Safety**: 0 compile-time errors from contract violations
- **Test Coverage**: >90% coverage for all contracts and mappings
- **Performance**: <5ms overhead for contract translation
- **Error Rate**: <1% context-related errors in production

### **Business Metrics**

- **Development Velocity**: Faster feature development due to clear boundaries
- **Bug Reduction**: Fewer integration bugs due to type safety
- **Team Productivity**: Independent domain development without coordination overhead
- **Code Quality**: Consistent patterns reduce cognitive load and maintenance burden

---

## 📚 **Resources**

### **Related Documentation**

- [DDD Migration Guide](./ddd-migration-guide.md) - Complete migration strategy
- [DDD Best Practices](./ddd-best-practices.md) - General DDD patterns

### **Code Examples**

- `libs/apitypes/src/domains/` - Contract and mapping type definitions
- `apps/marketplace/src/contracts/` - Contract implementations
- `test/contracts/` - Contract testing examples

### **Tools and Libraries**

- **TypeScript**: For type safety and compile-time validation
- **Zod**: For schema validation and context mapping
- **gRPC**: For efficient inter-service communication
- **Jest**: For contract and mapping testing

---

## 🚀 **Next Steps**

1. **Review the Guide**: Ensure all team members understand the domain contracts approach
2. **Start Implementation**: Begin with Week 2 of Phase 4 (Context Mapping Implementation)
3. **Set Up Monitoring**: Implement contract-level metrics and observability
4. **Train Team**: Ensure all developers understand the new patterns
5. **Plan Migration**: Prepare for gradual migration of existing services

This unified approach ensures we have consistent, maintainable, and type-safe communication between all domains while keeping the implementation manageable and performant.
