# 🏗️ Domain-Driven Design Architecture Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Current Architecture Assessment](#current-architecture-assessment)
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

## ✅ Current Architecture Assessment

### **Excellent Foundation You Already Have**

Your current architecture already implements many DDD principles:

#### **✅ Strong Technical Foundation**

- **BootstrapModule**: Perfect service initialization
- **EventService**: Type-safe event emission with correlation
- **Logger**: Structured logging with request correlation
- **PrometheusModule**: Comprehensive monitoring
- **Error Handling**: Standardized error patterns
- **Configuration**: Centralized configuration management

#### **✅ Event-Driven Architecture**

- **Type-safe events**: `vendor.created`, `vendor.updated`, etc.
- **Automatic correlation**: Request IDs → Event correlation IDs
- **Schema validation**: Zod schemas for event data
- **NATS integration**: Reliable event delivery

#### **✅ Service Boundaries**

- **Clear separation**: User, Vendor, Location, Gateway services
- **Protocol optimization**: HTTP, gRPC, NATS services
- **Health checks**: Comprehensive monitoring

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
- ✅ **Team learning**: Gradual adoption of DDD concepts

## 🏗️ Phase 1: Domain Organization

### **Current Structure**

```
apps/
├── gateway/           # Technical boundary
├── user/             # Technical boundary
├── vendor/           # Technical boundary
├── location/         # Technical boundary
└── algolia-sync/     # Technical boundary
```

### **Target DDD Structure**

```
apps/
├── marketplace/           # Business domain
│   ├── user-management/   # User domain
│   ├── vendor-management/ # Vendor domain
│   └── search-discovery/  # Search domain
├── location-services/     # Location domain
│   ├── geolocation/      # Location tracking
│   ├── proximity/        # Nearby searches
│   └── real-time/        # Live updates
├── communication/        # Communication domain
│   ├── notifications/    # Push notifications
│   ├── messaging/        # Real-time messaging
│   └── webhooks/         # External integrations
└── infrastructure/       # Cross-cutting concerns
    ├── api-gateway/      # HTTP routing
    ├── event-bus/        # Event streaming
    └── monitoring/       # Observability
```

### **Implementation Strategy**

#### **Step 1: Create Domain Directories**

```bash
# Create new domain structure
mkdir -p apps/marketplace/{user-management,vendor-management,search-discovery}
mkdir -p apps/location-services/{geolocation,proximity,real-time}
mkdir -p apps/communication/{notifications,messaging,webhooks}
mkdir -p apps/infrastructure/{api-gateway,event-bus,monitoring}
```

#### **Step 2: Move Existing Services**

```bash
# Move existing services to domain structure
mv apps/user apps/marketplace/user-management/
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

## 🎯 Phase 2: Domain Services

### **Enhance Existing Services with Domain Context**

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
export class UserRegistrationService {
	constructor(
		private prisma: PrismaService,
		private eventService: EventService,
		private logger: Logger,
	) {}

	async registerNewUser(registrationData: UserRegistrationData): Promise<UserProfile> {
		this.logger.log('Starting user registration process', {
			email: registrationData.email,
			source: registrationData.source,
		});

		// Domain validation
		await this.validateRegistrationData(registrationData);

		// Domain logic
		const user = await this.createUserProfile(registrationData);
		const preferences = this.createDefaultPreferences(registrationData);

		// Domain events
		await this.eventService.emit('marketplace.user_registered', {
			userId: user.id,
			email: user.email,
			source: registrationData.source,
			preferences: preferences,
			timestamp: new Date(),
		});

		this.logger.log('User registration completed', { userId: user.id });
		return user;
	}

	private async validateRegistrationData(data: UserRegistrationData): Promise<void> {
		// Business rules validation
		if (await this.prisma.db.user.findUnique({ where: { email: data.email } })) {
			throw new DomainError('USER_ALREADY_EXISTS', 'User with this email already exists', { email: data.email });
		}
	}

	private createDefaultPreferences(data: UserRegistrationData): UserPreferences {
		return {
			notificationSettings: { email: true, push: true, sms: false },
			searchRadius: 5000, // 5km default
			favoriteCategories: [],
			dietaryRestrictions: data.dietaryRestrictions || [],
		};
	}
}
```

### **Domain-Specific Error Handling**

#### **Enhanced Error System**

```typescript
// libs/shared/errors/domain-errors.ts
export class DomainError extends AppError {
	constructor(
		code: string,
		message: string,
		context?: Record<string, any>,
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
		favoriteCategories: ['restaurant', 'retail'],
	},
	timestamp: new Date(),
});

await this.eventService.emit('marketplace.vendor_onboarded', {
	vendorId: '456',
	businessType: 'restaurant',
	location: { lat: 40.7128, lng: -74.006 },
	ownerId: '123',
	services: ['dine_in', 'delivery', 'takeout'],
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
		businessType: z.enum(['restaurant', 'retail', 'service']),
		location: z.object({
			lat: z.number(),
			lng: z.number(),
		}),
		ownerId: z.string(),
		services: z.array(z.string()),
		timestamp: z.date(),
	}),

	'marketplace.user_subscribed': z.object({
		userId: z.string(),
		subscriptionType: z.enum(['free', 'premium', 'enterprise']),
		vendorPreferences: z.array(z.string()),
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

#### **User Registration Domain Service**

```typescript
// apps/marketplace/user-management/services/user-registration.service.ts
@Injectable()
export class UserRegistrationService {
	constructor(
		private prisma: PrismaService,
		private eventService: DomainEventService,
		private logger: Logger,
		private metricsService: DomainMetricsService,
	) {}

	async registerNewUser(registrationData: UserRegistrationData): Promise<UserProfile> {
		const startTime = Date.now();

		try {
			this.logger.log('Starting user registration', {
				email: registrationData.email,
				source: registrationData.source,
			});

			// Domain validation
			await this.validateRegistrationData(registrationData);

			// Domain logic
			const user = await this.createUserProfile(registrationData);
			const preferences = this.createDefaultPreferences(registrationData);

			// Domain events
			await this.eventService.emitDomainEvent('marketplace.user_registered', {
				userId: user.id,
				email: user.email,
				source: registrationData.source,
				preferences: preferences,
				timestamp: new Date(),
			});

			// Metrics
			this.metricsService.recordUserAction('registered', user.id, {
				source: registrationData.source,
				duration: Date.now() - startTime,
			});

			this.logger.log('User registration completed', { userId: user.id });
			return user;
		} catch (error) {
			this.metricsService.recordUserAction('registration_failed', null, {
				source: registrationData.source,
				error: error.message,
			});
			throw error;
		}
	}

	private async validateRegistrationData(data: UserRegistrationData): Promise<void> {
		// Business rules validation
		if (await this.prisma.db.user.findUnique({ where: { email: data.email } })) {
			throw new UserDomainError(UserDomainErrorCodes.ALREADY_EXISTS, 'User with this email already exists', {
				email: data.email,
			});
		}

		// Additional business rules
		if (data.age && data.age < 18) {
			throw new UserDomainError(UserDomainErrorCodes.INVALID_AGE, 'User must be at least 18 years old', {
				age: data.age,
			});
		}
	}

	private createDefaultPreferences(data: UserRegistrationData): UserPreferences {
		return {
			notificationSettings: { email: true, push: true, sms: false },
			searchRadius: 5000, // 5km default
			favoriteCategories: [],
			dietaryRestrictions: data.dietaryRestrictions || [],
		};
	}
}
```

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

### **Domain Controller Implementation**

#### **User Registration Controller**

```typescript
// apps/marketplace/user-management/controllers/user-registration.controller.ts
@Controller('users')
@UseGuards(AuthGuard)
@UseInterceptors(MetricsInterceptor, RequestIdInterceptor)
export class UserRegistrationController {
	constructor(private userRegistrationService: UserRegistrationService) {}

	@Post('register')
	async registerUser(@Body() data: UserRegistrationDto): Promise<UserProfile> {
		return this.userRegistrationService.registerNewUser(data);
	}

	@Post('verify-email')
	async verifyEmail(@Body() data: EmailVerificationDto): Promise<void> {
		return this.userRegistrationService.verifyEmail(data);
	}
}
```

## 📅 Migration Timeline

### **Phase 1: Foundation (Weeks 1-2)**

- [ ] Create domain directory structure
- [ ] Move existing services to domain structure
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

1. **Domain Discovery**: Map current services to business domains
2. **Team Preparation**: Ensure team is ready for DDD concepts
3. **Migration Planning**: Create detailed migration plan with timeline
4. **Start Implementation**: Begin with Phase 1 foundation work

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
