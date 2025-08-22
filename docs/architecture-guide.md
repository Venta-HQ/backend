# Venta Backend Architecture Guide

## Overview

Venta's backend is built on Domain-Driven Design principles, with a focus on simplicity, maintainability, and scalability. This guide explains our architecture, patterns, and best practices.

## 🏗️ System Architecture

### Domain Organization

Our system is organized into four main domains:

```
apps/
├── marketplace/           # Core business domain
│   ├── user-management/  # User accounts & profiles
│   ├── vendor-management/# Vendor operations
│   └── search-discovery/ # Search & recommendations
├── location-services/    # Location tracking domain
│   ├── geolocation/     # Location tracking
│   └── real-time/       # Live updates
├── communication/        # External integration domain
│   └── webhooks/        # External service webhooks
└── infrastructure/      # Cross-cutting concerns
    ├── api-gateway/     # API routing & auth
    └── file-management/ # File storage
```

### Domain Responsibilities

#### 🏪 Marketplace Domain

- User management and profiles
- Vendor management and operations
- Search and discovery features
- Core business logic

#### 📍 Location Services Domain

- Real-time location tracking
- Geospatial queries
- Location-based features
- WebSocket communication

#### 💬 Communication Domain

- External service integration
- Webhook processing
- Event handling
- External notifications

#### 🔧 Infrastructure Domain

- API routing and authentication
- File storage and management
- Cross-cutting concerns
- Technical infrastructure

## 🔄 Inter-Domain Communication

Services communicate through gRPC for type-safe, efficient inter-domain communication. For detailed information about gRPC in our DDD architecture, see the [gRPC Guide](./grpc-ddd-guide.md).

### Domain Contracts

Domains communicate through explicit contracts:

```typescript
// Clear, focused contracts
interface MarketplaceLocationContract {
	updateVendorLocation(vendorId: string, location: { lat: number; lng: number }): Promise<void>;
	getVendorLocation(vendorId: string): Promise<{ lat: number; lng: number } | null>;
	getVendorsInArea(bounds: LocationBounds): Promise<VendorLocation[]>;
}

// Implementation in location domain
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

### Context Mapping

Data translation between domains:

```typescript
// Clear directional mapping
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

### Domain Events

We use a strict event naming pattern and type-based validation to enforce domain boundaries and ensure consistent event handling.

#### Event Naming Convention

Events follow the pattern: `domain.subdomain.action`

```typescript
// ✅ Valid DDD Event Names
'marketplace.vendor.onboarded'; // Domain: marketplace, Subdomain: vendor, Action: onboarded
'location.vendor.location_updated'; // Domain: location, Subdomain: vendor, Action: location_updated
'marketplace.user.registered'; // Domain: marketplace, Subdomain: user, Action: registered
```

#### Type-Safe Event Schemas

```typescript
// Domain structure definition
const DOMAIN_SUBDOMAINS = {
	marketplace: ['user', 'vendor', 'search', 'subscription'],
	location: ['vendor', 'user', 'geolocation'],
} as const;

// Type-safe event schema
export const vendorEventSchemas = {
	'marketplace.vendor.onboarded': createEventSchema({
		vendorId: z.string(),
		ownerId: z.string(),
		location: z.object({
			lat: z.number().min(-90).max(90),
			lng: z.number().min(-180).max(180),
		}),
		timestamp: z.string().default(() => new Date().toISOString()),
	}).withContext(['vendorId', 'ownerId']), // Specify fields for correlation
} as const satisfies EnforceValidDomainEvents<'marketplace'>;
```

#### Event Structure

Events include business context and metadata:

```typescript
export interface BaseEvent {
	context?: Record<string, any>; // Business context for correlation
	meta: {
		eventId: string; // Unique event identifier
		source: string; // Service that emitted the event
		timestamp: string; // ISO timestamp
		version: string; // Event schema version
		correlationId?: string; // Request correlation ID
		domain?: string; // Extracted from event name
		subdomain?: string; // Extracted from event name
	};
	data: any; // Validated event data
}
```

#### Automatic Context Extraction

Events automatically extract business context from their schemas:

```typescript
// Event emission with automatic context
await this.eventService.emit('marketplace.vendor.onboarded', {
	vendorId: vendor.id,
	ownerId: vendor.ownerId,
	location: onboardingData.location,
});

// Automatically creates:
// {
//   context: { vendorId: "123", ownerId: "456" },
//   meta: {
//     eventId: "uuid",
//     source: "vendor-management",
//     timestamp: "2024-12-01T10:00:00Z",
//     version: "1.0",
//     correlationId: "req-123",
//     domain: "marketplace",
//     subdomain: "vendor"
//   },
//   data: { vendorId: "123", ownerId: "456", location: {...} }
// }
```

#### Event Best Practices

1. **Event Naming**

   - Use business terminology
   - Follow consistent patterns
   - Make names descriptive and specific

2. **Context Configuration**

   - Include business identifiers (userId, vendorId)
   - Avoid sensitive data
   - Keep context focused and relevant

3. **Schema Design**
   - Use smart defaults (timestamps)
   - Include validation rules
   - Make schemas comprehensive but not bloated

````

## 🛠️ Implementation Patterns

### Service Pattern

```typescript
@Injectable()
export class VendorService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
		private readonly locationContract: MarketplaceLocationContract,
	) {}

	async updateLocation(vendorId: string, location: LocationData) {
		// Validate
		if (!isValidLocation(location)) {
			throw new AppError(ErrorType.VALIDATION, 'Invalid location');
		}

		// Update state
		await this.prisma.db.vendor.update({
			where: { id: vendorId },
			data: { location },
		});

		// Update location services
		await this.locationContract.updateVendorLocation(vendorId, location);

		// Emit event
		await this.eventService.emit('marketplace.vendor.location_updated', {
			vendorId,
			location,
			timestamp: new Date(),
		});
	}
}
````

### Error Handling

We use a unified error handling system that provides consistent error management across all services. The system automatically adds domain context to errors and provides a standardized error response format.

#### Error Types

```typescript
enum ErrorType {
	VALIDATION = 'VALIDATION', // Input validation errors
	NOT_FOUND = 'NOT_FOUND', // Resource not found
	INTERNAL = 'INTERNAL', // Internal server errors
	EXTERNAL_SERVICE = 'EXTERNAL_SERVICE', // External service failures
}
```

#### Error Codes

```typescript
export const ErrorCodes = {
	// Generic errors
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	DATABASE_ERROR: 'DATABASE_ERROR',
	EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

	// Domain-specific errors
	USER_NOT_FOUND: 'USER_NOT_FOUND',
	VENDOR_NOT_FOUND: 'VENDOR_NOT_FOUND',
	LOCATION_INVALID_COORDINATES: 'LOCATION_INVALID_COORDINATES',
	WEBHOOK_PROCESSING_FAILED: 'WEBHOOK_PROCESSING_FAILED',
} as const;
```

#### Error Structure

```typescript
// Domain-specific error with context
throw new AppError(ErrorType.VALIDATION, ErrorCodes.LOCATION_INVALID_COORDINATES, 'Invalid coordinates provided', {
	lat: data.lat,
	lng: data.lng,
	domain: 'location-services',
	operation: 'update_vendor_location',
});

// Error handling middleware
@Catch(AppError)
export class AppExceptionFilter implements ExceptionFilter {
	constructor(private readonly configService: ConfigService) {}

	catch(exception: unknown, host: ArgumentsHost) {
		const appError = this.convertToAppError(exception);
		this.addDomainContext(appError); // Automatically adds domain context
		return this.formatResponse(appError, host);
	}
}
```

#### Error Response Format

```json
{
	"error": {
		"type": "VALIDATION",
		"code": "LOCATION_INVALID_COORDINATES",
		"message": "Invalid coordinates provided",
		"context": {
			"lat": 91,
			"long": 180,
			"domain": "location-services",
			"operation": "update_vendor_location"
		}
	}
}
```

#### Best Practices

1. **Use Descriptive Messages**

   ```typescript
   // ✅ Good - Descriptive message with context
   throw new AppError(
   	ErrorType.VALIDATION,
   	ErrorCodes.LOCATION_INVALID_COORDINATES,
   	'Latitude must be between -90 and 90 degrees',
   	{ lat: data.lat, expectedRange: '[-90, 90]' },
   );
   ```

2. **Include Rich Context**

   ```typescript
   // ✅ Good - Rich context for debugging
   throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to create user profile', {
   	clerkId: data.clerkId,
   	operation: 'create_user_profile',
   	table: 'user_profiles',
   	originalError: error.message,
   });
   ```

3. **Log Before Throwing**

   ```typescript
   try {
   	await this.prisma.db.user.create({ data });
   } catch (error) {
   	this.logger.error('Failed to create user', {
   		clerkId: data.clerkId,
   		error: error.message,
   		operation: 'create_user',
   	});

   	throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to create user', {
   		clerkId: data.clerkId,
   		operation: 'create_user',
   	});
   }
   ```

````

### Validation Pattern

```typescript
// Domain-specific validation
function isValidLocation(location: any): location is LocationData {
	return (
		typeof location === 'object' &&
		typeof location.lat === 'number' &&
		typeof location.lng === 'number' &&
		location.lat >= -90 &&
		location.lat <= 90 &&
		location.lng >= -180 &&
		location.lng <= 180
	);
}

// Service validation
@Injectable()
export class VendorService {
	async updateLocation(vendorId: string, location: unknown) {
		if (!isValidLocation(location)) {
			throw new AppError(ErrorType.VALIDATION, 'Invalid location');
		}
		// Process valid location...
	}
}
````

## 📊 Monitoring & Observability

### Metrics

```typescript
@Injectable()
export class VendorService {
	constructor(private readonly metricsService: MetricsService) {}

	async updateLocation(vendorId: string, location: LocationData) {
		const startTime = Date.now();

		try {
			await this.processLocationUpdate(vendorId, location);

			this.metricsService.recordSuccess('vendor.location.update', {
				duration: Date.now() - startTime,
			});
		} catch (error) {
			this.metricsService.recordError('vendor.location.update', {
				duration: Date.now() - startTime,
				error: error.message,
			});
			throw error;
		}
	}
}
```

### Logging

```typescript
@Injectable()
export class VendorService {
	private readonly logger = new Logger(VendorService.name);

	async updateLocation(vendorId: string, location: LocationData) {
		this.logger.log('Updating vendor location', {
			vendorId,
			location,
			operation: 'update_location',
		});

		try {
			await this.processLocationUpdate(vendorId, location);

			this.logger.log('Vendor location updated', {
				vendorId,
				success: true,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor location', {
				vendorId,
				error,
				stack: error.stack,
			});
			throw error;
		}
	}
}
```

## 🚀 Scaling Considerations

### Service Scaling

- Each service can scale independently
- Stateless services for horizontal scaling
- Redis for real-time features
- Database connection pooling

### Domain Scaling

- Add new services within domains
- Keep domain boundaries clean
- Scale based on domain load
- Independent deployment

## 📚 Related docs

- [Developer Guide](./developer-guide.md)
- [Concepts Guide](./concepts-guide.md)
- [Contracts Folder Conventions](./contracts-folder-conventions.md)
- [Domain Contracts & Context Mapping](./domain-contracts-guide.md)
- [API Documentation](./api-docs.md)
- [Testing Guide](./testing-guide.md)

This architecture provides a solid foundation for building and scaling our application while maintaining code quality and developer productivity.
