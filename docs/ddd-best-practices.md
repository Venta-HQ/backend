# 🏗️ DDD Best Practices & Patterns

## 📋 Table of Contents

- [Domain Organization](#domain-organization)
- [Service Design Patterns](#service-design-patterns)
- [Error Handling Patterns](#error-handling-patterns)
- [Event-Driven Communication](#event-driven-communication)
- [Code Organization](#code-organization)
- [Testing Patterns](#testing-patterns)
- [Common Anti-Patterns](#common-anti-patterns)
- [Performance Considerations](#performance-considerations)

## 🏛️ Domain Organization

### **Domain Boundaries**

Our system is organized into four main business domains:

#### **🏪 Marketplace Domain**

- **Purpose**: Core business operations for vendor-customer interactions
- **Services**: User management, vendor management, search discovery
- **Key Concepts**: Users, vendors, subscriptions, search, recommendations

#### **📍 Location Services Domain**

- **Purpose**: Real-time location tracking and geospatial operations
- **Services**: Geolocation, real-time location updates
- **Key Concepts**: Location tracking, proximity, geospatial queries

#### **💬 Communication Domain**

- **Purpose**: External integrations and communication channels
- **Services**: Webhooks, external integrations
- **Key Concepts**: Webhooks, external APIs, event processing

#### **🔧 Infrastructure Domain**

- **Purpose**: Cross-cutting technical concerns and platform services
- **Services**: API gateway, file management
- **Key Concepts**: Routing, authentication, file storage

### **Domain Principles**

#### **1. Clear Boundaries**

- Each domain has well-defined responsibilities
- Domains communicate through well-defined interfaces
- Avoid cross-domain dependencies

#### **2. Business Alignment**

- Domain structure reflects business organization
- Domain experts can understand the code structure
- Business terminology used throughout

#### **3. Independent Development**

- Teams can work on domains independently
- Domain-specific deployment and scaling
- Clear ownership and accountability

## 🔧 Service Design Patterns

### **Domain Service Pattern**

```typescript
@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly eventService: EventService,
	) {}

	async registerUser(registrationData: UserRegistrationData): Promise<UserProfile> {
		this.logger.log('Starting user registration process', {
			clerkId: registrationData.clerkId,
			source: registrationData.source || 'unknown',
		});

		try {
			const user = await this.prisma.db.user.create({
				data: { clerkId: registrationData.clerkId },
			});

			this.logger.log('User registration completed successfully', {
				clerkId: registrationData.clerkId,
				userId: user.id,
			});

			return user;
		} catch (error) {
			this.logger.error('Failed to register user', {
				clerkId: registrationData.clerkId,
				error,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to register user', {
				clerkId: registrationData.clerkId,
				operation: 'register_user',
			});
		}
	}
}
```

### **Domain Event Pattern**

```typescript
@Injectable()
export class VendorService {
	async onboardVendor(onboardingData: VendorOnboardingData): Promise<string> {
		this.logger.log('Starting vendor onboarding process', {
			ownerId: onboardingData.ownerId,
			vendorName: onboardingData.name,
		});

		try {
			const vendor = await this.prisma.db.vendor.create({
				data: {
					name: onboardingData.name,
					ownerId: onboardingData.ownerId,
					// ... other fields
				},
			});

			// Domain event - vendor created
			await this.eventService.emit('vendor.created', {
				id: vendor.id,
				name: vendor.name,
				ownerId: vendor.ownerId,
				timestamp: new Date(),
			});

			this.logger.log('Vendor onboarding completed successfully', {
				vendorId: vendor.id,
				ownerId: onboardingData.ownerId,
			});

			return vendor.id;
		} catch (error) {
			this.logger.error('Failed to onboard vendor', {
				ownerId: onboardingData.ownerId,
				error,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to onboard vendor', {
				operation: 'onboard_vendor',
				ownerId: onboardingData.ownerId,
			});
		}
	}
}
```

### **Domain Validation Pattern**

```typescript
@Injectable()
export class LocationService {
	async updateVendorLocation(data: LocationUpdate): Promise<void> {
		// Domain validation
		if (data.lat < -90 || data.lat > 90) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.LOCATION_INVALID_LATITUDE, 'Invalid latitude value', {
				lat: data.lat,
			});
		}

		if (data.long < -180 || data.long > 180) {
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.LOCATION_INVALID_LONGITUDE, 'Invalid longitude value', {
				long: data.long,
			});
		}

		// Domain logic
		await this.storeVendorLocation(data.entityId, {
			lat: data.lat,
			long: data.long,
		});

		// Domain event
		await this.eventService.emit('vendor.location.updated', {
			location: { lat: data.lat, long: data.long },
			timestamp: new Date(),
			vendorId: data.entityId,
		});
	}
}
```

## 🚨 Error Handling Patterns

### **Unified Error Handling**

```typescript
// Always use AppError with proper error types and codes
throw new AppError(
	ErrorType.VALIDATION, // Error type
	ErrorCodes.INVALID_INPUT, // Error code
	'Human-readable message', // User-friendly message
	{
		// Context data
		field: 'email',
		value: invalidEmail,
		operation: 'user_registration',
	},
);
```

### **Error Types**

```typescript
enum ErrorType {
	VALIDATION = 'VALIDATION', // Input validation errors
	NOT_FOUND = 'NOT_FOUND', // Resource not found
	INTERNAL = 'INTERNAL', // Internal server errors
	EXTERNAL_SERVICE = 'EXTERNAL_SERVICE', // External service failures
}
```

### **Domain-Specific Error Context**

```typescript
// All errors automatically receive domain context
// via AppExceptionFilter

// Error response includes:
{
  "error": {
    "type": "VALIDATION",
    "code": "USER_INVALID_EMAIL",
    "message": "Invalid email format",
    "context": {
      "field": "email",
      "value": "invalid-email",
      "domain": "marketplace",  // Automatically added
      "operation": "user_registration"
    }
  }
}
```

## 🔄 Event-Driven Communication

### **Event Schema Pattern**

```typescript
// libs/eventtypes/src/domains/marketplace/vendor/vendor.events.ts
export const vendorEventSchemas = {
	'vendor.created': z.object({
		id: z.string(),
		name: z.string(),
		ownerId: z.string(),
		timestamp: z.date(),
	}),
	'vendor.updated': z.object({
		id: z.string(),
		name: z.string().optional(),
		description: z.string().optional(),
		timestamp: z.date(),
	}),
	'vendor.deleted': z.object({
		id: z.string(),
		timestamp: z.date(),
	}),
} as const;

export type VendorEventDataMap = {
	'vendor.created': z.infer<(typeof vendorEventSchemas)['vendor.created']>;
	'vendor.updated': z.infer<(typeof vendorEventSchemas)['vendor.updated']>;
	'vendor.deleted': z.infer<(typeof vendorEventSchemas)['vendor.deleted']>;
};
```

### **Event Emission Pattern**

```typescript
// Always emit events after successful domain operations
await this.eventService.emit('vendor.created', {
	id: vendor.id,
	name: vendor.name,
	ownerId: vendor.ownerId,
	timestamp: new Date(),
});
```

### **Event Consumption Pattern**

```typescript
@Controller()
export class VendorEventsController {
	@MessagePattern('vendor.created')
	async handleVendorCreated(data: VendorCreatedEventData) {
		this.logger.log('Handling vendor created event', { vendorId: data.id });

		// Handle the event
		await this.searchService.indexVendor(data.id);
	}
}
```

## 📁 Code Organization

### **Service Structure**

```
apps/marketplace/services/user-management/
├── src/
│   ├── core/                    # Core domain logic
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   └── core.module.ts
│   ├── authentication/          # Auth subdomain
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── auth.module.ts
│   ├── subscriptions/           # Subscription subdomain
│   │   ├── subscription.service.ts
│   │   ├── subscription.controller.ts
│   │   └── subscription.module.ts
│   ├── vendors/                 # Vendor relationships
│   │   ├── vendor.service.ts
│   │   ├── vendor.controller.ts
│   │   └── vendor.module.ts
│   ├── location/                # Location events
│   │   ├── user-location-events.controller.ts
│   │   └── location.module.ts
│   ├── main.ts
│   └── user-management.module.ts
```

### **Module Organization**

```typescript
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.USER_MANAGEMENT,
			domain: 'marketplace', // Explicit domain
			protocol: 'grpc',
		}),
		CoreModule,
		AuthenticationModule,
		SubscriptionsModule,
		VendorsModule,
		LocationModule,
	],
})
export class UserManagementModule {}
```

### **Import Organization**

```typescript
// 1. External libraries
import { Injectable, Logger } from '@nestjs/common';
import { UserRegistrationData } from '@venta/apitypes';
// 2. Shared libraries (alphabetical)
import { AppError, ErrorCodes, ErrorType } from '@venta/nest/errors';
import { EventService } from '@venta/nest/modules';
// 3. Local imports (relative paths)
import { UserProfile } from './user.types';
```

## 🧪 Testing Patterns

### **Unit Test Pattern**

```typescript
describe('UserService', () => {
	let service: UserService;
	let mockPrisma: jest.Mocked<PrismaService>;
	let mockEventService: jest.Mocked<EventService>;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				UserService,
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

		service = module.get<UserService>(UserService);
		mockPrisma = module.get(PrismaService);
		mockEventService = module.get(EventService);
	});

	describe('registerUser', () => {
		it('should register user successfully', async () => {
			const registrationData = {
				clerkId: 'clerk_123',
				source: 'web' as const,
			};

			const mockUser = {
				id: 'user_123',
				clerkId: 'clerk_123',
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockPrisma.db.user.create.mockResolvedValue(mockUser);

			const result = await service.registerUser(registrationData);

			expect(result).toEqual(mockUser);
			expect(mockPrisma.db.user.create).toHaveBeenCalledWith({
				data: { clerkId: 'clerk_123' },
			});
		});

		it('should throw AppError on database failure', async () => {
			const registrationData = {
				clerkId: 'clerk_123',
				source: 'web' as const,
			};

			mockPrisma.db.user.create.mockRejectedValue(new Error('Database error'));

			await expect(service.registerUser(registrationData)).rejects.toThrow(AppError);
		});
	});
});
```

### **Integration Test Pattern**

```typescript
describe('UserController (e2e)', () => {
	let app: INestApplication;

	beforeEach(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [UserManagementModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	it('/users/register (POST)', () => {
		return request(app.getHttpServer())
			.post('/users/register')
			.send({
				clerkId: 'clerk_123',
				source: 'web',
			})
			.expect(201)
			.expect((res) => {
				expect(res.body).toHaveProperty('id');
				expect(res.body.clerkId).toBe('clerk_123');
			});
	});
});
```

## ❌ Common Anti-Patterns

### **1. Cross-Domain Dependencies**

```typescript
// ❌ Bad - Direct dependency on another domain
@Injectable()
export class UserService {
  constructor(
    private vendorService: VendorService, // Cross-domain dependency
  ) {}
}

// ✅ Good - Use events for cross-domain communication
@Injectable()
export class UserService {
  async createUser(data: UserData) {
    const user = await this.prisma.db.user.create({ data });

    // Emit event for other domains to consume
    await this.eventService.emit('user.created', {
      id: user.id,
      clerkId: user.clerkId,
      timestamp: new Date(),
    });

    return user;
  }
}
```

### **2. Domain Logic in Controllers**

```typescript
// ❌ Bad - Business logic in controller
@Controller('users')
export class UserController {
  @Post('register')
  async registerUser(@Body() data: UserData) {
    // Business logic here - should be in service
    if (data.email && !isValidEmail(data.email)) {
      throw new Error('Invalid email');
    }

    const user = await this.prisma.db.user.create({ data });
    return user;
  }
}

// ✅ Good - Controller delegates to service
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  async registerUser(@Body() data: UserData) {
    return this.userService.registerUser(data);
  }
}
```

### **3. Generic Error Handling**

```typescript
// ❌ Bad - Generic error handling
try {
	await this.prisma.db.user.create({ data });
} catch (error) {
	throw new Error('Something went wrong');
}

// ✅ Good - Specific error handling with context
try {
	await this.prisma.db.user.create({ data });
} catch (error) {
	throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to create user', {
		clerkId: data.clerkId,
		operation: 'create_user',
	});
}
```

### **4. Missing Domain Context**

```typescript
// ❌ Bad - No domain context in logs
this.logger.log('User created', { userId: user.id });

// ✅ Good - Rich domain context
this.logger.log('User registration completed successfully', {
	clerkId: registrationData.clerkId,
	source: registrationData.source,
	userId: user.id,
	operation: 'user_registration',
});
```

## ⚡ Performance Considerations

### **Domain-Specific Optimization**

#### **Marketplace Domain**

- **Caching**: User profiles, vendor data
- **Indexing**: Email, clerk ID, vendor search
- **Scaling**: Based on user activity patterns

#### **Location Services Domain**

- **Redis**: Geospatial data storage
- **WebSocket**: Real-time location updates
- **Scaling**: Based on location update frequency

#### **Communication Domain**

- **Queue Management**: Webhook processing
- **Retry Logic**: External service failures
- **Scaling**: Based on webhook volume

#### **Infrastructure Domain**

- **Load Balancing**: API gateway routing
- **Caching**: Static content, authentication
- **Scaling**: Based on overall system load

### **Event Processing Optimization**

```typescript
// Use batch processing for high-volume events
@MessagePattern('vendor.location.updated')
async handleVendorLocationUpdates(events: VendorLocationEventData[]) {
  // Process multiple events in batch
  await this.locationService.batchUpdateLocations(events);
}

// Use async processing for non-critical events
@MessagePattern('vendor.updated')
async handleVendorUpdated(data: VendorUpdatedEventData) {
  // Fire and forget for non-critical updates
  this.searchService.updateIndex(data.id).catch(error => {
    this.logger.error('Failed to update search index', { error, vendorId: data.id });
  });
}
```

### **Database Optimization**

```typescript
// Use database transactions for consistency
async createUserWithProfile(userData: UserData, profileData: ProfileData) {
  return this.prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    const profile = await tx.userProfile.create({
      data: { ...profileData, userId: user.id },
    });
    return { user, profile };
  });
}

// Use database indexes for performance
// Add to Prisma schema:
// @@index([clerkId])
// @@index([email])
// @@index([createdAt])
```

---

**These patterns ensure consistent, maintainable, and scalable code that aligns with DDD principles and business requirements.**
