# Venta Backend Concepts Guide

## Overview

This guide explains key concepts and patterns used in our DDD-based architecture. It serves as a reference for understanding the terminology and approaches we use.

## 📋 Table of Contents

1. [Domain Concepts](#domain-concepts)
2. [Communication Patterns](#communication-patterns)
3. [Data Patterns](#data-patterns)
4. [Error Handling](#error-handling)
5. [Testing Concepts](#testing-concepts)

## Domain Concepts

### Bounded Context

A bounded context is a clear boundary around a domain model. In our architecture, we have four main bounded contexts:

- **Marketplace**: Core business operations
- **Location Services**: Location tracking and geospatial features
- **Communication**: External integrations
- **Infrastructure**: Technical infrastructure

Example:

```typescript
// Marketplace bounded context
export namespace Marketplace {
	export interface Vendor {
		id: string;
		name: string;
		status: VendorStatus;
		location?: Location;
	}
}

// Location Services bounded context
export namespace LocationServices {
	export interface TrackedEntity {
		entityId: string;
		entityType: 'vendor' | 'user';
		coordinates: GeoCoordinates;
		accuracy: number;
	}
}
```

### Domain Events

Domain events represent significant changes in a domain. They are named using the pattern: `{domain}.{entity}.{event}`.

Example:

```typescript
// Event schema definition
export const vendorEventSchemas = {
	'marketplace.vendor.location_updated': z.object({
		vendorId: z.string(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		timestamp: z.date(),
	}),
} as const;

// Event emission
await this.eventService.emit('marketplace.vendor.location_updated', {
	vendorId,
	location,
	timestamp: new Date(),
});
```

### Context Mapping

Context mapping translates data between domains. Each domain owns its outbound translations.

Example:

```typescript
// Marketplace → Location Services
@Injectable()
export class MarketplaceToLocationContextMapper {
	toLocationServicesVendorUpdate(vendorId: string, location: { lat: number; lng: number }) {
		return {
			entityId: vendorId,
			coordinates: location,
			timestamp: new Date().toISOString(),
		};
	}
}
```

## Communication Patterns

### Domain Contracts

Contracts define how domains communicate with each other. They are interfaces that specify available operations.

Example:

```typescript
// Contract definition
interface MarketplaceLocationContract {
	updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void>;
	getVendorLocation(vendorId: string): Promise<{ lat: number; lng: number } | null>;
	getVendorsInArea(bounds: LocationBounds): Promise<VendorLocation[]>;
}

// Contract implementation
@Injectable()
export class LocationContractImpl implements MarketplaceLocationContract {
	constructor(
		private readonly locationService: LocationService,
		private readonly contextMapper: LocationToMarketplaceContextMapper,
	) {}

	async updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void> {
		await this.locationService.updateLocation(vendorId, location);
	}
}
```

### Event-Driven Communication

Services communicate through events for asynchronous operations and maintaining loose coupling.

Example:

```typescript
// Event listener
@Controller()
export class VendorEventsController {
	@MessagePattern('marketplace.vendor.location_updated')
	async handleVendorLocationUpdate(data: VendorLocationEventData) {
		await this.searchService.updateVendorLocation(data.vendorId, data.location);
	}
}
```

## Data Patterns

### Domain Types

Strong TypeScript types represent domain concepts.

Example:

```typescript
// Domain-specific types
interface VendorProfile {
	name: string;
	description?: string;
	contactEmail: string;
	phone?: string;
	businessHours?: BusinessHours;
}

interface BusinessHours {
	weekdays: TimeRange[];
	weekend?: TimeRange[];
}

interface TimeRange {
	start: string; // HH:mm format
	end: string; // HH:mm format
}
```

### Validation

Type-safe validation using TypeScript and Zod.

Example:

```typescript
// Type validation
function isValidBusinessHours(hours: unknown): hours is BusinessHours {
	return (
		typeof hours === 'object' &&
		hours !== null &&
		Array.isArray((hours as BusinessHours).weekdays) &&
		(hours as BusinessHours).weekdays.every(isValidTimeRange)
	);
}

// Schema validation
const businessHoursSchema = z.object({
	weekdays: z.array(timeRangeSchema),
	weekend: z.array(timeRangeSchema).optional(),
});
```

## Error Handling

### Domain Errors

Structured error handling with domain context.

Example:

```typescript
// Error definition
class AppError extends Error {
	constructor(
		public readonly type: ErrorType,
		public readonly code: ErrorCodes,
		message: string,
		public readonly context?: Record<string, any>,
	) {
		super(message);
	}
}

// Error usage
throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_BUSINESS_HOURS, 'Invalid business hours format', {
	vendorId,
	hours,
	domain: 'marketplace',
	operation: 'update_hours',
});
```

### Error Types

Categorized errors for better handling.

Example:

```typescript
enum ErrorType {
	VALIDATION = 'VALIDATION', // Input validation errors
	NOT_FOUND = 'NOT_FOUND', // Resource not found
	UNAUTHORIZED = 'UNAUTHORIZED', // Authentication errors
	FORBIDDEN = 'FORBIDDEN', // Authorization errors
	INTERNAL = 'INTERNAL', // Internal server errors
	EXTERNAL_SERVICE = 'EXTERNAL_SERVICE', // External service errors
}

enum ErrorCodes {
	// Marketplace domain
	VENDOR_NOT_FOUND = 'VENDOR_NOT_FOUND',
	INVALID_BUSINESS_HOURS = 'INVALID_BUSINESS_HOURS',

	// Location domain
	INVALID_COORDINATES = 'INVALID_COORDINATES',
	LOCATION_UPDATE_FAILED = 'LOCATION_UPDATE_FAILED',
}
```

## Testing Concepts

### Unit Testing

Testing individual components in isolation.

Example:

```typescript
describe('VendorService', () => {
	let service: VendorService;
	let mockPrisma: jest.Mocked<PrismaService>;
	let mockEventService: jest.Mocked<EventService>;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				VendorService,
				{
					provide: PrismaService,
					useValue: createMockPrismaService(),
				},
				{
					provide: EventService,
					useValue: createMockEventService(),
				},
			],
		}).compile();

		service = module.get<VendorService>(VendorService);
		mockPrisma = module.get(PrismaService);
		mockEventService = module.get(EventService);
	});

	it('should update vendor hours', async () => {
		const vendorId = 'vendor-123';
		const hours = createValidBusinessHours();

		await service.updateHours(vendorId, hours);

		expect(mockPrisma.db.vendor.update).toHaveBeenCalledWith({
			where: { id: vendorId },
			data: { businessHours: hours },
		});
	});
});
```

### Integration Testing

Testing interactions between components.

Example:

```typescript
describe('Vendor Management (e2e)', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [VendorManagementModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('should handle vendor location update', async () => {
		// Test complete flow
		await request(app.getHttpServer())
			.put('/vendors/vendor-123/location')
			.send({ lat: 40.7128, lng: -74.006 })
			.expect(200);

		// Verify side effects
		expect(mockLocationService.updateLocation).toHaveBeenCalled();
		expect(mockEventService.emit).toHaveBeenCalledWith('marketplace.vendor.location_updated', expect.any(Object));
	});
});
```

## Common Terms

### Domain-Specific

- **Vendor**: A business entity in the marketplace
- **Location Tracking**: Real-time location monitoring
- **Business Hours**: Operating hours for a vendor
- **Service Area**: Geographic area where a vendor operates

### Technical

- **Context Mapper**: Translates data between domains
- **Domain Contract**: Interface for inter-domain communication
- **Domain Event**: Notification of domain state change
- **Bounded Context**: Clear boundary around a domain model

## Best Practices

1. **Keep Domains Separate**

   - Clear boundaries
   - No direct dependencies
   - Use contracts for communication

2. **Use Strong Types**

   - TypeScript interfaces
   - Zod schemas
   - No any types

3. **Handle Errors Properly**

   - Domain-specific errors
   - Clear error messages
   - Proper context

4. **Follow Naming Conventions**
   - Domain-prefixed events
   - Clear service names
   - Descriptive types

## Anti-Patterns to Avoid

1. **❌ Cross-Domain Dependencies**

   ```typescript
   // Bad: Direct dependency
   class VendorService {
     constructor(private locationService: LocationService) {}
   }

   // Good: Use contracts
   class VendorService {
     constructor(private locationContract: MarketplaceLocationContract) {}
   }
   ```

2. **❌ Mixed Domain Logic**

   ```typescript
   // Bad: Mixed concerns
   class VendorService {
     async updateLocation(vendorId: string, location: any) {
       // Marketplace logic
       await this.updateVendorProfile(vendorId, { location });

       // Location domain logic - don't do this!
       await this.updateRedisGeoIndex(vendorId, location);
     }
   }

   // Good: Separate concerns
   class VendorService {
     async updateLocation(vendorId: string, location: LocationData) {
       await this.updateVendorProfile(vendorId, { location });
       await this.locationContract.updateVendorLocation(vendorId, location);
     }
   }
   ```

3. **❌ Generic Types**

   ```typescript
   // Bad: Generic types
   interface Entity {
   	id: string;
   	data: any;
   }

   // Good: Specific types
   interface Vendor {
   	id: string;
   	name: string;
   	location?: GeoLocation;
   	businessHours?: BusinessHours;
   }
   ```

## Additional Resources

- [Architecture Guide](./architecture-guide.md) - System architecture overview
- [Developer Guide](./developer-guide.md) - Development patterns and practices
- [API Documentation](./api-docs.md) - API endpoints and usage
- [Testing Guide](./testing-guide.md) - Testing patterns and practices

This guide should help you understand the key concepts and patterns used in our architecture. Remember that these patterns are designed to make development simpler and more maintainable, not to add unnecessary complexity.
