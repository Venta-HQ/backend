# Venta Backend Developer Guide

## Overview

This guide provides practical examples and best practices for developing in our DDD-based architecture. It focuses on common development tasks and how to implement them correctly.

## 📋 Table of Contents

1. [Adding New Features](#adding-new-features)
2. [Working with Domains](#working-with-domains)
3. [Inter-Domain Communication](#inter-domain-communication)
4. [Error Handling](#error-handling)
5. [Testing](#testing)
6. [Common Patterns](#common-patterns)

## Adding New Features

### Step 1: Identify the Domain

First, determine which domain your feature belongs to:

- **Marketplace Domain**: Core business features
- **Location Services Domain**: Location-related features
- **Communication Domain**: External integration features
- **Infrastructure Domain**: Technical infrastructure features

### Step 2: Create the Service

```typescript
// apps/marketplace/services/vendor-management/src/features/vendor-hours.service.ts
@Injectable()
export class VendorHoursService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
	) {}

	async updateHours(vendorId: string, hours: BusinessHours) {
		// Validate
		if (!isValidBusinessHours(hours)) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_BUSINESS_HOURS, 'Invalid business hours format');
		}

		// Update
		await this.prisma.db.vendor.update({
			where: { id: vendorId },
			data: { businessHours: hours },
		});

		// Emit event
		await this.eventService.emit('marketplace.vendor.hours_updated', {
			vendorId,
			hours,
			timestamp: new Date(),
		});
	}
}
```

### Step 3: Add to Module

```typescript
// apps/marketplace/services/vendor-management/src/vendor-management.module.ts
@Module({
	imports: [PrismaModule, EventModule],
	providers: [
		VendorHoursService, // Add new service
	],
	controllers: [
		VendorHoursController, // Add new controller
	],
})
export class VendorManagementModule {}
```

### Step 4: Create Controller

```typescript
// apps/marketplace/services/vendor-management/src/features/vendor-hours.controller.ts
@Controller('vendors')
export class VendorHoursController {
	constructor(private readonly hoursService: VendorHoursService) {}

	@Put(':id/hours')
	async updateHours(@Param('id') vendorId: string, @Body() hours: BusinessHours) {
		return this.hoursService.updateHours(vendorId, hours);
	}
}
```

## Working with Domains

### Domain Service Pattern

```typescript
@Injectable()
export class VendorService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
		private readonly locationContract: MarketplaceLocationContract,
	) {}

	// Clear method names
	async activateVendor(vendorId: string): Promise<void> {
		// Load entity
		const vendor = await this.prisma.db.vendor.findUnique({
			where: { id: vendorId },
		});

		if (!vendor) {
			throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.VENDOR_NOT_FOUND, 'Vendor not found');
		}

		// Business logic
		if (!vendor.location) {
			throw new AppError(
				ErrorType.VALIDATION,
				ErrorCodes.VENDOR_NO_LOCATION,
				'Cannot activate vendor without location',
			);
		}

		// Update state
		await this.prisma.db.vendor.update({
			where: { id: vendorId },
			data: { status: 'ACTIVE' },
		});

		// Emit event
		await this.eventService.emit('marketplace.vendor.activated', {
			vendorId,
			timestamp: new Date(),
		});
	}
}
```

### Domain Events

```typescript
// libs/eventtypes/src/domains/marketplace/vendor/vendor.events.ts
export const vendorEventSchemas = {
	'marketplace.vendor.activated': z.object({
		vendorId: z.string(),
		timestamp: z.date(),
	}),

	'marketplace.vendor.hours_updated': z.object({
		vendorId: z.string(),
		hours: businessHoursSchema,
		timestamp: z.date(),
	}),
} as const;

// Using events
@Injectable()
export class VendorService {
	async updateHours(vendorId: string, hours: BusinessHours) {
		// Update state...

		// Emit event with validation
		await this.eventService.emit('marketplace.vendor.hours_updated', {
			vendorId,
			hours,
			timestamp: new Date(),
		});
	}
}
```

## Inter-Domain Communication

Services communicate through gRPC for type-safe, efficient inter-domain communication. For detailed information about gRPC in our DDD architecture, see the [gRPC Guide](./grpc-ddd-guide.md).

### Using Domain Contracts

```typescript
// Calling another domain
@Injectable()
export class VendorService {
	constructor(private readonly locationContract: MarketplaceLocationContract) {}

	async updateLocation(vendorId: string, location: LocationData) {
		// Validate in this domain
		if (!isValidLocation(location)) {
			throw new AppError(ErrorType.VALIDATION, 'Invalid location');
		}

		// Call location domain
		await this.locationContract.updateVendorLocation(vendorId, location);
	}
}
```

### Context Mapping

```typescript
// Clear data translation
@Injectable()
export class MarketplaceToLocationContextMapper {
	toLocationServicesVendorUpdate(vendorId: string, location: LocationData) {
		return {
			entityId: vendorId,
			coordinates: location,
			timestamp: new Date().toISOString(),
		};
	}
}

// Using the mapper
@Injectable()
export class LocationContractImpl implements MarketplaceLocationContract {
	constructor(
		private readonly contextMapper: MarketplaceToLocationContextMapper,
		private readonly locationService: LocationService,
	) {}

	async updateVendorLocation(vendorId: string, location: LocationData) {
		const locationData = this.contextMapper.toLocationServicesVendorUpdate(vendorId, location);
		await this.locationService.updateLocation(locationData);
	}
}
```

## Error Handling

### Domain Errors

```typescript
// Throwing domain errors
throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_BUSINESS_HOURS, 'Invalid business hours format', {
	vendorId,
	hours,
	domain: 'marketplace',
	operation: 'update_hours',
});

// Error handling
try {
	await this.vendorService.updateHours(vendorId, hours);
} catch (error) {
	if (error instanceof AppError) {
		this.logger.error('Failed to update vendor hours', {
			errorType: error.type,
			errorCode: error.code,
			context: error.context,
		});
	}
	throw error;
}
```

### Validation

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

// Service validation
@Injectable()
export class VendorHoursService {
	async updateHours(vendorId: string, hours: unknown) {
		if (!isValidBusinessHours(hours)) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_BUSINESS_HOURS, 'Invalid business hours format');
		}
		// Process valid hours...
	}
}
```

## Testing

### Unit Testing

```typescript
describe('VendorHoursService', () => {
	let service: VendorHoursService;
	let mockPrisma: jest.Mocked<PrismaService>;
	let mockEventService: jest.Mocked<EventService>;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				VendorHoursService,
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

		service = module.get<VendorHoursService>(VendorHoursService);
		mockPrisma = module.get(PrismaService);
		mockEventService = module.get(EventService);
	});

	describe('updateHours', () => {
		it('should update vendor hours', async () => {
			const vendorId = 'vendor-123';
			const hours = createValidBusinessHours();

			await service.updateHours(vendorId, hours);

			expect(mockPrisma.db.vendor.update).toHaveBeenCalledWith({
				where: { id: vendorId },
				data: { businessHours: hours },
			});

			expect(mockEventService.emit).toHaveBeenCalledWith(
				'marketplace.vendor.hours_updated',
				expect.objectContaining({
					vendorId,
					hours,
				}),
			);
		});

		it('should validate hours format', async () => {
			const vendorId = 'vendor-123';
			const invalidHours = { weekdays: 'invalid' };

			await expect(service.updateHours(vendorId, invalidHours)).rejects.toThrow(AppError);
		});
	});
});
```

### Integration Testing

```typescript
describe('VendorHours (e2e)', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [VendorManagementModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('/vendors/:id/hours (PUT)', () => {
		const hours = createValidBusinessHours();

		return request(app.getHttpServer())
			.put('/vendors/vendor-123/hours')
			.send(hours)
			.expect(200)
			.expect((res) => {
				expect(res.body.success).toBe(true);
			});
	});
});
```

## Common Patterns

### Service Organization

Services should follow these patterns:

- Dependencies at the top
- Public methods first
- Private methods last
- Always include request context
- Use proper error handling

```typescript
@Injectable()
export class VendorService {
	// Dependencies at the top
	constructor(
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
		private readonly locationContract: MarketplaceLocationContract,
		private readonly contextService: RequestContextService, // Always include context
		private readonly logger: AppLogger,
	) {}

	// Public methods first
	async updateVendor(vendorId: string, data: UpdateVendorData) {
		const context = this.contextService.getContext();

		this.logger.log('Updating vendor', {
			vendorId,
			operation: 'updateVendor',
		});

		try {
			await this.validateVendorUpdate(data);
			await this.processVendorUpdate(vendorId, data);
			await this.notifyVendorUpdate(vendorId, data);

			this.logger.log('Vendor updated', {
				vendorId,
				success: true,
			});
		} catch (error) {
			this.logger.error('Failed to update vendor', {
				vendorId,
				error: error.message,
			});
			throw error;
		}
	}

	// Private methods last
	private async validateVendorUpdate(data: UpdateVendorData) {
		// Validation logic with context
		if (!isValidVendorData(data)) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_VENDOR_DATA, 'Invalid vendor data', {
				requestId: this.contextService.getRequestId(),
				data,
			});
		}
	}

	private async processVendorUpdate(vendorId: string, data: UpdateVendorData) {
		// Update logic with context
		await this.prisma.db.vendor.update({
			where: { id: vendorId },
			data,
		});
	}

	private async notifyVendorUpdate(vendorId: string, data: UpdateVendorData) {
		// Notification logic with context
		await this.eventService.emit('marketplace.vendor.updated', {
			vendorId,
			data,
			timestamp: new Date(),
		});
	}
}
```

For detailed information about request context handling, see the [Request Context Guide](./request-context-guide.md).

````

### Module Organization

```typescript
@Module({
	// Imports first
	imports: [PrismaModule, EventModule, MarketplaceContractsModule],

	// Providers second
	providers: [VendorService, VendorHoursService, VendorLocationService],

	// Controllers third
	controllers: [VendorController, VendorHoursController, VendorLocationController],

	// Exports last
	exports: [VendorService],
})
export class VendorManagementModule {}
````

### File Organization

```
services/vendor-management/
├── src/
│   ├── features/           # Feature-specific code
│   │   ├── hours/         # Business hours feature
│   │   │   ├── vendor-hours.service.ts
│   │   │   ├── vendor-hours.controller.ts
│   │   │   └── vendor-hours.types.ts
│   │   └── location/      # Location feature
│   │       ├── vendor-location.service.ts
│   │       ├── vendor-location.controller.ts
│   │       └── vendor-location.types.ts
│   ├── core/              # Core vendor logic
│   │   ├── vendor.service.ts
│   │   ├── vendor.controller.ts
│   │   └── vendor.types.ts
│   ├── vendor-management.module.ts
│   └── main.ts
└── test/                  # Tests
    ├── features/
    │   ├── hours.spec.ts
    │   └── location.spec.ts
    └── core/
        └── vendor.spec.ts
```

## Best Practices

1. **Keep Services Focused**

   - Single responsibility
   - Clear method names
   - Domain-specific logic

2. **Use Strong Types**

   - TypeScript interfaces
   - Zod schemas
   - No any types

3. **Handle Errors Properly**

   - Use AppError
   - Include context
   - Proper logging

4. **Write Good Tests**

   - Unit tests for logic
   - Integration tests for flows
   - Clear test names

5. **Follow Patterns**
   - Consistent file structure
   - Standard naming
   - Clear organization

## Common Mistakes to Avoid

1. ❌ **Don't Mix Domain Logic**

   ```typescript
   // Bad: Mixing domain logic
   class VendorService {
     constructor(private locationService: LocationService) {} // Direct dependency
   }

   // Good: Use contracts
   class VendorService {
     constructor(private locationContract: MarketplaceLocationContract) {}
   }
   ```

2. ❌ **Don't Skip Validation**

   ```typescript
   // Bad: No validation
   async updateHours(vendorId: string, hours: any) {
     await this.prisma.db.vendor.update({
       where: { id: vendorId },
       data: { hours },
     });
   }

   // Good: Proper validation
   async updateHours(vendorId: string, hours: unknown) {
     if (!isValidBusinessHours(hours)) {
       throw new AppError(ErrorType.VALIDATION, 'Invalid hours');
     }
     // Process valid hours...
   }
   ```

3. ❌ **Don't Ignore Events**

   ```typescript
   // Bad: Silent updates
   async updateStatus(vendorId: string, status: string) {
     await this.prisma.db.vendor.update({
       where: { id: vendorId },
       data: { status },
     });
   }

   // Good: Emit events
   async updateStatus(vendorId: string, status: string) {
     await this.prisma.db.vendor.update({
       where: { id: vendorId },
       data: { status },
     });

     await this.eventService.emit('marketplace.vendor.status_updated', {
       vendorId,
       status,
       timestamp: new Date(),
     });
   }
   ```

4. ❌ **Don't Skip Error Handling**

   ```typescript
   // Bad: Generic errors
   catch (error) {
     console.error(error);
     throw new Error('Something went wrong');
   }

   // Good: Proper error handling
   catch (error) {
     this.logger.error('Failed to update vendor', {
       vendorId,
       error,
       stack: error.stack,
     });
     throw new AppError(
       ErrorType.INTERNAL,
       ErrorCodes.UPDATE_FAILED,
       'Failed to update vendor'
     );
   }
   ```

## Additional Resources

- [Architecture Guide](./architecture-guide.md) - System architecture overview
- [gRPC Guide](./grpc-ddd-guide.md) - gRPC in DDD architecture
- [Request Context Guide](./request-context-guide.md) - Request context handling
- [Concepts Guide](./concepts-guide.md) - Key concepts and patterns
- [API Documentation](./api-docs.md) - API endpoints and usage
- [Testing Guide](./testing-guide.md) - Testing patterns and practices

This guide should help you develop effectively in our DDD-based architecture. Remember to keep things simple, follow established patterns, and focus on maintainability.
