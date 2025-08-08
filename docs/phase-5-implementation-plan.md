# Phase 5: Advanced DDD Patterns Implementation Plan

## Overview

Phase 5 focuses on implementing advanced DDD patterns to enhance our domain model and business logic organization. This phase builds upon our existing DDD foundation to introduce more sophisticated patterns that will improve code maintainability and business alignment.

## 🎯 Goals

1. **Aggregate Implementation**

   - Enforce business invariants
   - Ensure data consistency
   - Protect domain model integrity

2. **Value Objects**

   - Encapsulate domain concepts
   - Improve type safety
   - Enhance domain model expressiveness

3. **Domain Repositories**

   - Abstract data access
   - Enforce aggregate boundaries
   - Improve query patterns

4. **Domain Specifications**
   - Encapsulate complex queries
   - Improve business rule reusability
   - Enhance query composability

## 📅 Implementation Schedule

### Week 1: Aggregates

#### **1. Define Aggregate Boundaries**

- [ ] Identify aggregate roots in each domain
- [ ] Define entity relationships within aggregates
- [ ] Document aggregate invariants

#### **2. Implement Core Aggregates**

**Marketplace Domain**:

```typescript
// User Aggregate
export class User implements AggregateRoot {
	private constructor(
		private readonly id: string,
		private readonly clerkId: string,
		private profile: UserProfile,
		private preferences: UserPreferences,
		private readonly createdAt: Date,
		private updatedAt: Date,
	) {}

	static create(clerkId: string): User {
		return new User(
			randomUUID(),
			clerkId,
			UserProfile.createEmpty(),
			UserPreferences.createDefault(),
			new Date(),
			new Date(),
		);
	}

	updateProfile(profile: UserProfile): void {
		this.profile = profile;
		this.updatedAt = new Date();
	}

	updatePreferences(preferences: UserPreferences): void {
		this.preferences = preferences;
		this.updatedAt = new Date();
	}
}

// Vendor Aggregate
export class Vendor implements AggregateRoot {
	private constructor(
		private readonly id: string,
		private readonly ownerId: string,
		private profile: VendorProfile,
		private location: VendorLocation | null,
		private status: VendorStatus,
		private readonly createdAt: Date,
		private updatedAt: Date,
	) {}

	static create(ownerId: string, profile: VendorProfile): Vendor {
		return new Vendor(randomUUID(), ownerId, profile, null, VendorStatus.INACTIVE, new Date(), new Date());
	}

	updateLocation(location: VendorLocation): void {
		this.location = location;
		this.updatedAt = new Date();
	}

	activate(): void {
		if (!this.location) {
			throw new DomainError('Cannot activate vendor without location');
		}
		this.status = VendorStatus.ACTIVE;
		this.updatedAt = new Date();
	}
}
```

**Location Services Domain**:

```typescript
// Location Tracking Aggregate
export class LocationTracking implements AggregateRoot {
	private constructor(
		private readonly id: string,
		private readonly entityId: string,
		private readonly entityType: 'user' | 'vendor',
		private currentLocation: GeoLocation,
		private trackingStatus: TrackingStatus,
		private readonly createdAt: Date,
		private updatedAt: Date,
	) {}

	static create(entityId: string, entityType: 'user' | 'vendor', location: GeoLocation): LocationTracking {
		return new LocationTracking(
			randomUUID(),
			entityId,
			entityType,
			location,
			TrackingStatus.ACTIVE,
			new Date(),
			new Date(),
		);
	}

	updateLocation(location: GeoLocation): void {
		this.currentLocation = location;
		this.updatedAt = new Date();
	}

	stopTracking(): void {
		this.trackingStatus = TrackingStatus.INACTIVE;
		this.updatedAt = new Date();
	}
}
```

### Week 2: Value Objects

#### **1. Implement Core Value Objects**

**Common Value Objects**:

```typescript
// Location Value Object
export class GeoLocation {
	private constructor(
		private readonly lat: number,
		private readonly lng: number,
	) {
		this.validate();
	}

	static create(lat: number, lng: number): GeoLocation {
		return new GeoLocation(lat, lng);
	}

	private validate(): void {
		if (this.lat < -90 || this.lat > 90) {
			throw new DomainError('Invalid latitude');
		}
		if (this.lng < -180 || this.lng > 180) {
			throw new DomainError('Invalid longitude');
		}
	}

	equals(other: GeoLocation): boolean {
		return this.lat === other.lat && this.lng === other.lng;
	}

	toJSON(): { lat: number; lng: number } {
		return { lat: this.lat, lng: this.lng };
	}
}

// Email Value Object
export class Email {
	private constructor(private readonly value: string) {
		this.validate();
	}

	static create(email: string): Email {
		return new Email(email);
	}

	private validate(): void {
		if (!isValidEmail(this.value)) {
			throw new DomainError('Invalid email format');
		}
	}

	equals(other: Email): boolean {
		return this.value === other.value;
	}

	toString(): string {
		return this.value;
	}
}
```

**Domain-Specific Value Objects**:

```typescript
// Marketplace Domain
export class VendorProfile {
	private constructor(
		private readonly name: string,
		private readonly description: string | null,
		private readonly email: Email,
		private readonly phone: PhoneNumber | null,
	) {}

	static create(name: string, email: string): VendorProfile {
		return new VendorProfile(name, null, Email.create(email), null);
	}

	withDescription(description: string): VendorProfile {
		return new VendorProfile(this.name, description, this.email, this.phone);
	}

	withPhone(phone: string): VendorProfile {
		return new VendorProfile(this.name, this.description, this.email, PhoneNumber.create(phone));
	}
}

// Location Services Domain
export class LocationBounds {
	private constructor(
		private readonly northEast: GeoLocation,
		private readonly southWest: GeoLocation,
	) {}

	static create(ne: { lat: number; lng: number }, sw: { lat: number; lng: number }): LocationBounds {
		return new LocationBounds(GeoLocation.create(ne.lat, ne.lng), GeoLocation.create(sw.lat, sw.lng));
	}

	contains(location: GeoLocation): boolean {
		// Implement bounds check
		return true;
	}
}
```

### Week 3: Domain Repositories

#### **1. Define Repository Interfaces**

```typescript
// Marketplace Domain
export interface UserRepository {
	save(user: User): Promise<void>;
	findById(id: string): Promise<User | null>;
	findByClerkId(clerkId: string): Promise<User | null>;
	findByEmail(email: Email): Promise<User | null>;
}

export interface VendorRepository {
	save(vendor: Vendor): Promise<void>;
	findById(id: string): Promise<Vendor | null>;
	findByOwnerId(ownerId: string): Promise<Vendor[]>;
	findActive(): Promise<Vendor[]>;
}

// Location Services Domain
export interface LocationTrackingRepository {
	save(tracking: LocationTracking): Promise<void>;
	findById(id: string): Promise<LocationTracking | null>;
	findByEntityId(entityId: string): Promise<LocationTracking | null>;
	findInBounds(bounds: LocationBounds): Promise<LocationTracking[]>;
}
```

#### **2. Implement Repository Classes**

```typescript
// Marketplace Domain
@Injectable()
export class PrismaUserRepository implements UserRepository {
	constructor(private readonly prisma: PrismaService) {}

	async save(user: User): Promise<void> {
		await this.prisma.db.user.upsert({
			where: { id: user.id },
			create: user.toPrisma(),
			update: user.toPrisma(),
		});
	}

	async findById(id: string): Promise<User | null> {
		const data = await this.prisma.db.user.findUnique({
			where: { id },
			include: { profile: true, preferences: true },
		});
		return data ? User.fromPrisma(data) : null;
	}
}

// Location Services Domain
@Injectable()
export class RedisLocationTrackingRepository implements LocationTrackingRepository {
	constructor(private readonly redis: Redis) {}

	async save(tracking: LocationTracking): Promise<void> {
		await this.redis.geoadd('location_tracking', tracking.location.lng, tracking.location.lat, tracking.entityId);
	}

	async findInBounds(bounds: LocationBounds): Promise<LocationTracking[]> {
		const results = await this.redis.georadius(
			'location_tracking',
			bounds.center.lng,
			bounds.center.lat,
			bounds.radius,
			'm',
			'WITHCOORD',
		);
		return results.map(LocationTracking.fromRedis);
	}
}
```

### Week 4: Domain Specifications

#### **1. Implement Core Specifications**

```typescript
// Base Specification
export interface Specification<T> {
	isSatisfiedBy(candidate: T): boolean;
	and(other: Specification<T>): Specification<T>;
	or(other: Specification<T>): Specification<T>;
	not(): Specification<T>;
}

// Marketplace Domain
export class ActiveVendorSpecification implements Specification<Vendor> {
	isSatisfiedBy(vendor: Vendor): boolean {
		return vendor.status === VendorStatus.ACTIVE && vendor.location !== null;
	}
}

export class VendorInRadiusSpecification implements Specification<Vendor> {
	constructor(
		private readonly center: GeoLocation,
		private readonly radiusInMeters: number,
	) {}

	isSatisfiedBy(vendor: Vendor): boolean {
		if (!vendor.location) return false;
		return calculateDistance(this.center, vendor.location) <= this.radiusInMeters;
	}
}

// Location Services Domain
export class ActiveTrackingSpecification implements Specification<LocationTracking> {
	isSatisfiedBy(tracking: LocationTracking): boolean {
		return tracking.status === TrackingStatus.ACTIVE;
	}
}

export class InBoundsSpecification implements Specification<LocationTracking> {
	constructor(private readonly bounds: LocationBounds) {}

	isSatisfiedBy(tracking: LocationTracking): boolean {
		return this.bounds.contains(tracking.location);
	}
}
```

#### **2. Implement Specification Composition**

```typescript
// Composite Specifications
export class AndSpecification<T> implements Specification<T> {
	constructor(
		private readonly left: Specification<T>,
		private readonly right: Specification<T>,
	) {}

	isSatisfiedBy(candidate: T): boolean {
		return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
	}
}

export class OrSpecification<T> implements Specification<T> {
	constructor(
		private readonly left: Specification<T>,
		private readonly right: Specification<T>,
	) {}

	isSatisfiedBy(candidate: T): boolean {
		return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
	}
}

export class NotSpecification<T> implements Specification<T> {
	constructor(private readonly spec: Specification<T>) {}

	isSatisfiedBy(candidate: T): boolean {
		return !this.spec.isSatisfiedBy(candidate);
	}
}
```

## 🔍 Testing Strategy

### **1. Aggregate Testing**

```typescript
describe('Vendor', () => {
	it('should not allow activation without location', () => {
		const vendor = Vendor.create('owner-123', VendorProfile.create('Test Vendor', 'test@example.com'));
		expect(() => vendor.activate()).toThrow(DomainError);
	});

	it('should allow activation with location', () => {
		const vendor = Vendor.create('owner-123', VendorProfile.create('Test Vendor', 'test@example.com'));
		vendor.updateLocation(GeoLocation.create(40.7128, -74.006));
		expect(() => vendor.activate()).not.toThrow();
	});
});
```

### **2. Value Object Testing**

```typescript
describe('GeoLocation', () => {
	it('should validate latitude bounds', () => {
		expect(() => GeoLocation.create(-91, 0)).toThrow(DomainError);
		expect(() => GeoLocation.create(91, 0)).toThrow(DomainError);
		expect(() => GeoLocation.create(45, 0)).not.toThrow();
	});

	it('should validate longitude bounds', () => {
		expect(() => GeoLocation.create(0, -181)).toThrow(DomainError);
		expect(() => GeoLocation.create(0, 181)).toThrow(DomainError);
		expect(() => GeoLocation.create(0, 90)).not.toThrow();
	});
});
```

### **3. Repository Testing**

```typescript
describe('PrismaUserRepository', () => {
	let repository: PrismaUserRepository;
	let prisma: jest.Mocked<PrismaService>;

	beforeEach(() => {
		prisma = createMockPrismaService();
		repository = new PrismaUserRepository(prisma);
	});

	it('should save user aggregate', async () => {
		const user = User.create('clerk-123');
		await repository.save(user);
		expect(prisma.db.user.upsert).toHaveBeenCalledWith({
			where: { id: user.id },
			create: expect.any(Object),
			update: expect.any(Object),
		});
	});
});
```

### **4. Specification Testing**

```typescript
describe('VendorInRadiusSpecification', () => {
	it('should identify vendors within radius', () => {
		const center = GeoLocation.create(40.7128, -74.006);
		const spec = new VendorInRadiusSpecification(center, 5000);

		const nearbyVendor = Vendor.create('owner-123', VendorProfile.create('Near', 'near@example.com'));
		nearbyVendor.updateLocation(GeoLocation.create(40.7129, -74.007));

		const farVendor = Vendor.create('owner-456', VendorProfile.create('Far', 'far@example.com'));
		farVendor.updateLocation(GeoLocation.create(41.7128, -75.006));

		expect(spec.isSatisfiedBy(nearbyVendor)).toBe(true);
		expect(spec.isSatisfiedBy(farVendor)).toBe(false);
	});
});
```

## 📈 Success Metrics

### Technical Metrics

- **Aggregate Coverage**: 100% of domain entities organized in aggregates
- **Value Object Usage**: All domain concepts represented as value objects
- **Repository Pattern**: All data access through repositories
- **Specification Coverage**: Complex queries using specifications

### Business Metrics

- **Code Clarity**: Business rules clearly expressed in domain model
- **Maintainability**: Reduced coupling between domain concepts
- **Extensibility**: Easy addition of new business rules
- **Type Safety**: Compile-time validation of domain rules

## 🚀 Next Steps

1. **Review & Approval**

   - Review implementation plan with team
   - Get stakeholder approval
   - Set up tracking metrics

2. **Team Preparation**

   - Share implementation plan
   - Conduct DDD patterns training
   - Set up pair programming sessions

3. **Implementation Start**
   - Begin with Week 1 tasks
   - Daily progress tracking
   - Weekly review meetings

This plan provides a structured approach to implementing advanced DDD patterns while maintaining code quality and business alignment.
