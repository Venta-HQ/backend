# 🏗️ Domain-Driven Design Migration Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Current Functionality Analysis](#current-functionality-analysis)
- [DDD Migration Strategy](#ddd-migration-strategy)
- [Phase 1: Domain Organization](#phase-1-domain-organization)
- [Phase 2: Domain Services](#phase-2-domain-services)
- [Phase 3: Domain Events](#phase-3-domain-events)
- [Phase 4: Bounded Contexts](#phase-4-bounded-contexts)
- [Implementation Examples](#implementation-examples)
- [Migration Timeline](#migration-timeline)
- [Benefits](#benefits)
- [Next Steps](#next-steps)

## 🎯 Overview

This guide outlines the migration of your Venta backend system to a Domain-Driven Design (DDD) architecture. Your current excellent technical foundation provides the perfect base for this evolution, enabling business alignment, team scalability, and long-term maintainability.

**Focus**: This migration focuses on your **current implemented features** while designing domains to accommodate **future planned features**.

## ✅ Current Functionality Analysis

### **Currently Implemented Features**

#### **🔍 User Management**

- **Authentication**: Clerk-based user authentication
- **User Profiles**: Basic user account management
- **User-Vendor Relationships**: Users can have associated vendors

#### **🏪 Vendor Management**

- **Vendor Profiles**: Create, read, update vendor information
- **Vendor Ownership**: Users can own and manage vendors
- **Profile Data**: Name, description, contact info, images

#### **📍 Location Services**

- **Real-time Location Tracking**: Both users and vendors
- **Geospatial Queries**: Find vendors near user location
- **Location Broadcasting**: Real-time updates via WebSocket
- **Redis Geolocation**: Efficient location storage and queries

#### **🔍 Search & Discovery**

- **Algolia Integration**: Search indexing and discovery
- **Location-based Search**: Find vendors by proximity
- **Basic Search**: Vendor name and location criteria

#### **📤 File Management**

- **Image Upload**: Profile picture and vendor image uploads
- **File Storage**: Cloud-based file storage

#### **🔗 External Integrations**

- **Clerk Webhooks**: User authentication events
- **Subscription Webhooks**: Payment/subscription events
- **RevenueCat**: Subscription management

### **Future Planned Features** (Design Considerations)

- **Reviews & Ratings**: Customer feedback system
- **Favorites**: User vendor bookmarking
- **In-app Payments**: Stripe integration for transactions
- **Analytics & Reporting**: Business intelligence
- **Loyalty Programs**: Customer retention features
- **Event Organizers**: Additional user types
- **Static Businesses**: Location-based advertising

## 🚀 DDD Migration Strategy

### **Evolutionary Approach (Not Revolutionary)**

We'll **evolve** your current architecture:

1. **Keep existing patterns**: Bootstrap, logging, monitoring, events
2. **Add domain organization**: Organize by business domains
3. **Enhance domain semantics**: Add business context to existing patterns
4. **Gradual migration**: One domain at a time

### **Migration Principles**

- ✅ **Preserve existing patterns**: Keep what works
- ✅ **Add domain context**: Layer business semantics on top
- ✅ **Incremental migration**: One domain at a time
- ✅ **Backward compatibility**: No breaking changes
- ✅ **Future-ready design**: Accommodate planned features

## 🏗️ Phase 1: Domain Organization

### **Current Structure**

```
apps/
├── gateway/           # HTTP API Gateway
├── user/             # User Management (gRPC)
├── vendor/           # Vendor Management (gRPC)
├── location/         # Location Services (gRPC)
├── websocket-gateway/ # Real-time Communication
├── algolia-sync/     # Search Indexing
└── [partially migrated domains]
```

### **Target DDD Structure**

```
apps/
├── marketplace/           # Core Business Domain
│   ├── user-management/   # User accounts & profiles
│   ├── vendor-management/ # Vendor profiles & operations
│   └── search-discovery/  # Search & discovery (Algolia)
├── location-services/     # Location Domain
│   ├── geolocation/      # Location tracking & storage
│   ├── proximity/        # Nearby vendor queries
│   └── real-time/        # Live location updates (WebSocket)
├── communication/        # Communication Domain
│   ├── notifications/    # Push notifications (future)
│   ├── messaging/        # Real-time messaging (future)
│   └── webhooks/         # External integrations
└── infrastructure/       # Cross-cutting Concerns
    ├── api-gateway/      # HTTP routing & auth
    ├── file-management/  # File uploads & storage
    └── monitoring/       # Observability
```

### **Implementation Strategy**

#### **Step 1: Complete Domain Directory Structure**

```bash
# Create remaining domain structure
mkdir -p apps/marketplace/vendor-management
mkdir -p apps/marketplace/search-discovery
mkdir -p apps/location-services/geolocation
mkdir -p apps/location-services/real-time
mkdir -p apps/communication/webhooks
mkdir -p apps/infrastructure/api-gateway
mkdir -p apps/infrastructure/file-management
```

#### **Step 2: Move Existing Services**

```bash
# Move existing services to domain structure
mv apps/vendor apps/marketplace/vendor-management/
mv apps/location apps/location-services/geolocation/
mv apps/gateway apps/infrastructure/api-gateway/
mv apps/websocket-gateway apps/location-services/real-time/
mv apps/algolia-sync apps/marketplace/search-discovery/
```

#### **Step 3: Update Module Names**

```typescript
// Before: Technical naming
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.USER,
			protocol: 'grpc',
		}),
	],
})
export class UserModule {}

// After: Domain naming
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.USER_MANAGEMENT,
			protocol: 'grpc',
		}),
	],
})
export class UserManagementModule {}
```

#### **Step 4: Establish Consistent gRPC Patterns**

**Pattern: Subdomain modules define their own dependencies**

```typescript
// ✅ Correct: Subdomain module defines its own gRPC connection
@Module({
	controllers: [ClerkWebhooksController],
	imports: [
		ConfigModule,
		GrpcInstanceModule.register<UserServiceClient>({
			proto: 'user.proto',
			protoPackage: USER_PACKAGE_NAME,
			provide: USER_SERVICE_NAME,
			serviceName: USER_SERVICE_NAME,
			urlFactory: (configService: ConfigService) => configService.get('USER_SERVICE_ADDRESS') || 'localhost:5000',
		}),
	],
})
export class ClerkWebhooksModule {}

// ✅ Correct: Root module only handles app-level infrastructure
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.CLERK_WEBHOOKS,
			protocol: 'http',
		}),
		ClerkWebhooksModule,
		RevenueCatWebhooksModule,
	],
})
export class WebhooksModule {}
```

**Consistent Patterns Established:**

- **Subdomain modules** define their own gRPC connections
- **Root modules** only handle app-level infrastructure (BootstrapModule, ConfigModule)
- **Controllers** use dependencies from their own modules
- **No dependency inversion** where subdomains depend on root-level infrastructure

#### **Step 5: Domain-Specific Naming and Organization**

**User Management Subdomain Organization:**

```typescript
// ✅ Organized into clear subdomains with generic naming
apps/marketplace/user-management/src/
├── authentication/           # Generic auth handling (not Clerk-specific)
│   ├── auth.controller.ts    # Handles user creation/deletion
│   ├── auth.service.ts       # Business logic for auth
│   └── auth.module.ts        # Auth subdomain module
├── subscriptions/            # Subscription management (not RevenueCat-specific)
│   ├── subscription.controller.ts
│   ├── subscription.service.ts
│   └── subscription.module.ts
└── vendors/                  # User-vendor relationships
    ├── vendor.controller.ts
    ├── vendor.service.ts
    └── vendor.module.ts
```

**Webhook Service Specific Naming:**

```typescript
// ✅ Specific naming for external integrations
apps/communication/webhooks/src/
├── clerk/                    # Clerk-specific webhook handling
│   ├── clerk-webhooks.controller.ts
│   └── clerk-webhooks.module.ts
└── revenuecat/               # RevenueCat-specific webhook handling
    ├── revenuecat-webhooks.controller.ts
    └── revenuecat-webhooks.module.ts
```

**Naming Principles:**

- **Generic domain names** for internal business logic (authentication, subscriptions, vendors)
- **Specific provider names** for external integrations (clerk, revenuecat)
- **Clear separation** between domain logic and external adapters

## 🎯 Phase 2: Domain Services ✅ COMPLETE

### **Enhanced Existing Services with Domain Context**

#### **Current Service Pattern**

```typescript
@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private eventService: EventService,
	) {}

	async createUser(data: CreateUserDto): Promise<User> {
		const user = await this.prisma.db.user.create({ data });
		await this.eventService.emit('user.created', user);
		return user;
	}
}
```

#### **Enhanced Domain Service Pattern**

```typescript
// Domain-specific service with business logic
@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private eventService: EventService,
		private logger: Logger,
	) {}

	async registerUser(registrationData: UserRegistrationData): Promise<UserProfile> {
		this.logger.log('Starting user registration process', {
			clerkId: registrationData.clerkId,
			source: registrationData.source || 'unknown',
		});

		try {
			const user = await this.prisma.db.user.create({
				data: {
					clerkId: registrationData.clerkId,
				},
			});

			this.logger.log('User registration completed successfully', {
				clerkId: registrationData.clerkId,
				source: registrationData.source,
				userId: user.id,
			});

			return user;
		} catch (error) {
			this.logger.error('Failed to register user', {
				clerkId: registrationData.clerkId,
				error,
				source: registrationData.source,
			});
			throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Failed to register user', {
				clerkId: registrationData.clerkId,
				operation: 'register_user',
				source: registrationData.source,
			});
		}
	}
}
```

### **Unified Error Handling System**

#### **Consolidated Error Approach**

```typescript
// libs/nest/errors/app-error.ts
export class AppError extends Error {
	constructor(
		public readonly type: ErrorType,
		public readonly code: string,
		public readonly message: string,
		public readonly context?: Record<string, any>,
	) {
		super(message);
		this.name = 'AppError';
	}
}

// libs/nest/errors/errorcodes.ts
export const ErrorCodes = {
	// Generic errors
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	DATABASE_ERROR: 'DATABASE_ERROR',
	EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
	
	// User domain errors
	USER_NOT_FOUND: 'USER_NOT_FOUND',
	USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
	
	// Vendor domain errors
	VENDOR_NOT_FOUND: 'VENDOR_NOT_FOUND',
	VENDOR_ALREADY_EXISTS: 'VENDOR_ALREADY_EXISTS',
	
	// Location domain errors
	LOCATION_INVALID_COORDINATES: 'LOCATION_INVALID_COORDINATES',
	LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
	LOCATION_REDIS_OPERATION_FAILED: 'LOCATION_REDIS_OPERATION_FAILED',
	LOCATION_PROXIMITY_SEARCH_FAILED: 'LOCATION_PROXIMITY_SEARCH_FAILED',
} as const;
```

#### **Automatic Domain Context**

```typescript
// libs/nest/errors/app-exception.filter.ts
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
	constructor(private readonly configService: ConfigService) {}

	catch(exception: unknown, host: ArgumentsHost) {
		const appError = this.convertToAppError(exception);
		this.addDomainContext(appError); // Automatically adds domain context
		
		// Format response based on protocol (HTTP/gRPC/WebSocket)
		return this.formatResponse(appError, host);
	}

	private addDomainContext(error: AppError): void {
		const domain = this.configService.get<string>('DOMAIN');
		if (domain) {
			error.context = { ...error.context, domain };
		}
	}
}
```

### **New EventTypes Library**

#### **Centralized Event Management**

```typescript
// libs/eventtypes/src/domains/marketplace/user/user.events.ts
export const userEventSchemas = {
	'user.location.updated': z.object({
		userId: z.string(),
		location: z.object({
			lat: z.number(),
			long: z.number(),
		}),
		timestamp: z.date(),
	}),
} as const;

export type UserEventDataMap = {
	'user.location.updated': z.infer<typeof userEventSchemas['user.location.updated']>;
};

// libs/eventtypes/src/shared/unified-event-registry.ts
export const ALL_EVENT_SCHEMAS = {
	...userEventSchemas,
	...vendorEventSchemas,
} as const;

export type EventDataMap = UserEventDataMap & VendorEventDataMap;
```

### **Explicit Domain Configuration**

#### **Application Bootstrap with Domain Context**

```typescript
// apps/marketplace/user-management/src/main.ts
async function bootstrap() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
		transport: Transport.GRPC,
		options: {
			package: 'user_management',
			protoPath: join(__dirname, 'proto/user-management.proto'),
		},
	});

	await BootstrapService.bootstrapGrpcMicroservice({
		app,
		domain: 'marketplace', // Explicit DDD domain
		appName: APP_NAMES.USER_MANAGEMENT,
	});

	await app.listen();
}
```

### **Key Achievements**

✅ **Enhanced all domain services** with business logic and proper error handling
✅ **Created unified error handling system** with automatic domain context
✅ **Established `eventtypes` library** for centralized event management
✅ **Consolidated error codes** into single source of truth
✅ **Removed redundant validation** (already handled by gRPC contracts and event system)
✅ **Added explicit domain configuration** to all applications
✅ **Updated domain folder structure** across all libraries
✅ **Enhanced logging** with business context and domain semantics
		public readonly domain?: string,
	) {
		super(code, message, context);
	}
}

// Domain-specific error classes
export class UserDomainError extends DomainError {
	constructor(code: string, message: string, context?: Record<string, any>) {
		super(code, message, context, 'user-management');
	}
}

export class VendorDomainError extends DomainError {
	constructor(code: string, message: string, context?: Record<string, any>) {
		super(code, message, context, 'vendor-management');
	}
}

// Domain error codes
export const UserDomainErrorCodes = {
	ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
	INVALID_CREDENTIALS: 'USER_INVALID_CREDENTIALS',
	PROFILE_INCOMPLETE: 'USER_PROFILE_INCOMPLETE',
} as const;

export const VendorDomainErrorCodes = {
	ALREADY_EXISTS: 'VENDOR_ALREADY_EXISTS',
	INVALID_LOCATION: 'VENDOR_INVALID_LOCATION',
	INSUFFICIENT_PERMISSIONS: 'VENDOR_INSUFFICIENT_PERMISSIONS',
} as const;
```

## 🔄 Phase 3: Domain Events

### **Enhance Existing Event System with Domain Semantics**

#### **Current Event Pattern**

```typescript
// Technical events
await this.eventService.emit('user.created', { userId: '123' });
await this.eventService.emit('vendor.updated', { vendorId: '456' });
```

#### **Enhanced Domain Event Pattern**

```typescript
// Domain events with business context
await this.eventService.emit('marketplace.user_registered', {
	userId: '123',
	email: 'user@example.com',
	source: 'web_registration',
	preferences: {
		notificationSettings: { email: true, push: true },
		searchRadius: 5000,
		favoriteCategories: ['food', 'retail'],
	},
	timestamp: new Date(),
});

await this.eventService.emit('marketplace.vendor_onboarded', {
	vendorId: '456',
	businessType: 'food_vendor',
	location: { lat: 40.7128, lng: -74.006 },
	ownerId: '123',
	services: ['dine_in', 'delivery', 'takeout'],
	timestamp: new Date(),
});

await this.eventService.emit('location.vendor_location_updated', {
	vendorId: '456',
	location: { lat: 40.7128, lng: -74.006 },
	accuracy: 10,
	timestamp: new Date(),
});
```

### **Domain Event Registry**

#### **Enhanced Event Registry**

```typescript
// libs/apitypes/src/domains/marketplace/marketplace.events.ts
export const marketplaceEventSchemas = {
	'marketplace.user_registered': z.object({
		userId: z.string(),
		email: z.string().email(),
		source: z.enum(['web_registration', 'mobile_app', 'admin']),
		preferences: z.object({
			notificationSettings: z.object({
				email: z.boolean(),
				push: z.boolean(),
				sms: z.boolean(),
			}),
			searchRadius: z.number(),
			favoriteCategories: z.array(z.string()),
		}),
		timestamp: z.date(),
	}),

	'marketplace.vendor_onboarded': z.object({
		vendorId: z.string(),
		businessType: z.enum(['food_vendor', 'retail', 'service']),
		location: z.object({
			lat: z.number(),
			lng: z.number(),
		}),
		ownerId: z.string(),
		services: z.array(z.string()),
		timestamp: z.date(),
	}),

	'marketplace.vendor_profile_updated': z.object({
		vendorId: z.string(),
		updatedFields: z.array(z.string()),
		timestamp: z.date(),
	}),
} as const;

// libs/apitypes/src/domains/location/location.events.ts
export const locationEventSchemas = {
	'location.vendor_location_updated': z.object({
		vendorId: z.string(),
		location: z.object({
			lat: z.number(),
			lng: z.number(),
		}),
		accuracy: z.number().optional(),
		timestamp: z.date(),
	}),

	'location.user_location_updated': z.object({
		userId: z.string(),
		location: z.object({
			lat: z.number(),
			lng: z.number(),
		}),
		accuracy: z.number().optional(),
		timestamp: z.date(),
	}),

	'location.proximity_alert': z.object({
		userId: z.string(),
		vendorId: z.string(),
		distance: z.number(),
		location: z.object({
			lat: z.number(),
			lng: z.number(),
		}),
		timestamp: z.date(),
	}),
} as const;
```

### **Unified Domain Event Registry**

#### **Enhanced Unified Registry**

```typescript
// libs/apitypes/src/shared/events/unified-domain-event-registry.ts
import { locationEventSchemas } from '../../domains/location/location.events';
import { marketplaceEventSchemas } from '../../domains/marketplace/marketplace.events';

export const ALL_DOMAIN_EVENT_SCHEMAS = {
	...marketplaceEventSchemas,
	...locationEventSchemas,
} as const;

export type AvailableDomainEventSubjects = keyof typeof ALL_DOMAIN_EVENT_SCHEMAS;

// Enhanced event service with domain context
@Injectable()
export class DomainEventService {
	async emitDomainEvent<TSubject extends AvailableDomainEventSubjects>(
		subject: TSubject,
		data: EventDataMap[TSubject],
		metadata?: EventMetadata,
	): Promise<void> {
		// Domain-specific validation
		const schema = ALL_DOMAIN_EVENT_SCHEMAS[subject];
		const validatedData = schema ? schema.parse(data) : data;

		// Enhanced event with domain context
		const event: DomainEvent = {
			correlationId: metadata?.correlationId || this.requestContextService?.getRequestId(),
			data: validatedData,
			eventId: randomUUID(),
			source: metadata?.source || this.appName,
			timestamp: new Date().toISOString(),
			version: metadata?.version || '1.0',
			domain: this.extractDomainFromSubject(subject),
		};

		await this.natsClient.emit(subject, event);
		this.logger.log(`Emitted domain event: ${subject}`, {
			eventId: event.eventId,
			domain: event.domain,
		});
	}

	private extractDomainFromSubject(subject: string): string {
		return subject.split('.')[0]; // 'marketplace.user_registered' -> 'marketplace'
	}
}
```

## 🏛️ Phase 4: Bounded Contexts

### **Define Clear Domain Boundaries**

#### **Marketplace Bounded Context**

```typescript
// apps/marketplace/marketplace.module.ts
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.MARKETPLACE,
			protocol: 'http',
			additionalModules: [UserManagementModule, VendorManagementModule, SearchDiscoveryModule],
		}),
	],
})
export class MarketplaceModule {}

// apps/marketplace/user-management/user-management.module.ts
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.USER_MANAGEMENT,
			protocol: 'grpc',
			additionalModules: [EventsModule.register({ appName: APP_NAMES.USER_MANAGEMENT })],
		}),
	],
	controllers: [UserRegistrationController, UserProfileController],
	providers: [UserRegistrationService, UserProfileService, UserPreferencesService],
})
export class UserManagementModule {}
```

#### **Location Services Bounded Context**

```typescript
// apps/location-services/location-services.module.ts
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.LOCATION_SERVICES,
			protocol: 'http',
			additionalModules: [GeolocationModule, ProximityModule, RealTimeLocationModule],
		}),
	],
})
export class LocationServicesModule {}

// apps/location-services/geolocation/geolocation.module.ts
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: APP_NAMES.GEOLOCATION,
			protocol: 'grpc',
			additionalModules: [EventsModule.register({ appName: APP_NAMES.GEOLOCATION })],
		}),
	],
	controllers: [LocationController],
	providers: [LocationService, GeocodingService],
})
export class GeolocationModule {}
```

## 💻 Implementation Examples

### **Domain Service Implementation**

#### **Vendor Onboarding Domain Service**

```typescript
// apps/marketplace/vendor-management/services/vendor-onboarding.service.ts
@Injectable()
export class VendorOnboardingService {
	constructor(
		private prisma: PrismaService,
		private eventService: DomainEventService,
		private logger: Logger,
		private locationService: LocationService,
	) {}

	async onboardNewVendor(onboardingData: VendorOnboardingData): Promise<VendorProfile> {
		this.logger.log('Starting vendor onboarding', {
			businessName: onboardingData.businessName,
			businessType: onboardingData.businessType,
		});

		// Domain validation
		await this.validateOnboardingData(onboardingData);

		// Domain logic
		const vendor = await this.createVendorProfile(onboardingData);
		await this.setupVendorServices(vendor.id, onboardingData.services);

		// Domain events
		await this.eventService.emitDomainEvent('marketplace.vendor_onboarded', {
			vendorId: vendor.id,
			businessType: onboardingData.businessType,
			location: onboardingData.location,
			ownerId: onboardingData.ownerId,
			services: onboardingData.services,
			timestamp: new Date(),
		});

		this.logger.log('Vendor onboarding completed', { vendorId: vendor.id });
		return vendor;
	}

	private async validateOnboardingData(data: VendorOnboardingData): Promise<void> {
		// Business rules validation
		if (
			await this.prisma.db.vendor.findFirst({
				where: {
					businessName: data.businessName,
					ownerId: data.ownerId,
				},
			})
		) {
			throw new VendorDomainError(
				VendorDomainErrorCodes.ALREADY_EXISTS,
				'Vendor with this name already exists for this owner',
				{ businessName: data.businessName, ownerId: data.ownerId },
			);
		}

		// Location validation
		if (!this.locationService.isValidLocation(data.location)) {
			throw new VendorDomainError(VendorDomainErrorCodes.INVALID_LOCATION, 'Invalid location coordinates', {
				location: data.location,
			});
		}
	}
}
```

#### **Location Tracking Domain Service**

```typescript
// apps/location-services/geolocation/services/location-tracking.service.ts
@Injectable()
export class LocationTrackingService {
	constructor(
		private prisma: PrismaService,
		private eventService: DomainEventService,
		private logger: Logger,
		private redis: Redis,
	) {}

	async updateVendorLocation(vendorId: string, location: LocationData): Promise<void> {
		this.logger.log('Updating vendor location', { vendorId, location });

		// Domain validation
		await this.validateLocationData(location);

		// Domain logic
		await this.storeVendorLocation(vendorId, location);
		await this.updateGeolocationIndex(vendorId, location);

		// Domain events
		await this.eventService.emitDomainEvent('location.vendor_location_updated', {
			vendorId,
			location,
			accuracy: location.accuracy,
			timestamp: new Date(),
		});

		this.logger.log('Vendor location updated', { vendorId });
	}

	async findNearbyVendors(userLocation: LocationData, radius: number = 5000): Promise<VendorLocation[]> {
		// Domain logic for proximity search
		const nearbyVendors = await this.redis.georadius(
			'vendor_locations',
			userLocation.lng,
			userLocation.lat,
			radius,
			'm',
			'WITHCOORD',
			'WITHDIST',
		);

		return this.formatNearbyVendors(nearbyVendors);
	}

	private async validateLocationData(location: LocationData): Promise<void> {
		if (location.lat < -90 || location.lat > 90) {
			throw new LocationDomainError('INVALID_LATITUDE', 'Invalid latitude value');
		}
		if (location.lng < -180 || location.lng > 180) {
			throw new LocationDomainError('INVALID_LONGITUDE', 'Invalid longitude value');
		}
	}
}
```

### **Domain Controller Implementation**

#### **Vendor Management Controller**

```typescript
// apps/marketplace/vendor-management/controllers/vendor-management.controller.ts
@Controller('vendors')
@UseGuards(AuthGuard)
@UseInterceptors(MetricsInterceptor, RequestIdInterceptor)
export class VendorManagementController {
	constructor(
		private vendorOnboardingService: VendorOnboardingService,
		private vendorProfileService: VendorProfileService,
	) {}

	@Post()
	async createVendor(@Body() data: CreateVendorDto, @Req() req: AuthedRequest): Promise<VendorProfile> {
		return this.vendorOnboardingService.onboardNewVendor({
			...data,
			ownerId: req.userId,
		});
	}

	@Get(':id')
	async getVendor(@Param('id') id: string): Promise<VendorProfile> {
		return this.vendorProfileService.getVendorById(id);
	}

	@Put(':id')
	async updateVendor(
		@Param('id') id: string,
		@Body() data: UpdateVendorDto,
		@Req() req: AuthedRequest,
	): Promise<VendorProfile> {
		return this.vendorProfileService.updateVendor(id, data, req.userId);
	}
}
```

## 📅 Migration Timeline

### **Phase 1: Foundation (Weeks 1-2)**

- [x] Create domain directory structure (partially done)
- [ ] Complete service moves to domain structure
- [ ] Update module names and app names
- [ ] Update documentation

### **Phase 2: Domain Services (Weeks 3-4)**

- [ ] Create domain-specific error classes
- [ ] Enhance existing services with domain logic
- [ ] Add business validation rules
- [ ] Update service interfaces

### **Phase 3: Domain Events (Weeks 5-6)**

- [ ] Create domain event schemas
- [ ] Enhance event service with domain context
- [ ] Update existing event emissions
- [ ] Add domain event validation

### **Phase 4: Bounded Contexts (Weeks 7-8)**

- [ ] Define bounded context boundaries
- [ ] Create domain-specific modules
- [ ] Update service communication
- [ ] Integration testing

### **Phase 5: Documentation & Training (Weeks 9-10)**

- [ ] Update all documentation
- [ ] Create domain-specific guides
- [ ] Team training on DDD concepts
- [ ] Code review guidelines

## ✅ Benefits

### **Business Alignment**

- ✅ **Domain Experts**: Non-technical stakeholders can understand structure
- ✅ **Business Logic**: Related functionality co-located
- ✅ **Clear Boundaries**: Each domain has clear responsibilities

### **Team Organization**

- ✅ **Cross-Functional Teams**: Teams organized around business domains
- ✅ **Ownership**: Clear ownership of business capabilities
- ✅ **Autonomy**: Teams can work independently within domains

### **Scalability**

- ✅ **Domain Growth**: Domains can grow independently
- ✅ **Technology Choice**: Different domains can use different technologies
- ✅ **Deployment**: Independent deployment per domain

### **Long-term Maintainability**

- ✅ **Industry Standard**: Follows proven DDD patterns
- ✅ **Future-proof**: Scales with business growth
- ✅ **Team Scalability**: Supports growing engineering teams

## 🚀 Next Steps

### **Immediate Actions**

1. **Complete Domain Organization**: Finish moving services to domain structure
2. **Update Configuration**: Update `nest-cli.json` and module configurations
3. **Domain Service Enhancement**: Add business logic to existing services
4. **Domain Event Implementation**: Create business-focused events

### **Success Metrics**

- ✅ Business stakeholders can understand system structure
- ✅ Teams can work independently on domains
- ✅ Business logic is co-located with business domains
- ✅ System can scale with business growth
- ✅ New domains can be added easily

### **Future Considerations**

- **Monitor Success**: Track if DDD improves business alignment
- **Team Feedback**: Gather feedback on domain organization
- **Continuous Improvement**: Refine domain boundaries as business evolves
- **Documentation**: Keep domain documentation up to date

Your current architecture provides an **excellent foundation** for DDD migration. The patterns you've established (bootstrap, logging, monitoring, events) will work perfectly in a DDD structure and actually make the migration easier than starting from scratch.

**This migration will position your system for long-term success and scalability.**
