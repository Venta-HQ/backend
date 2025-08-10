# Marketplace Domain Type System Organization

**Status**: ✅ **GOLDEN STANDARD** - Template for other domains  
**Created**: 2024 Post-DDD Migration  
**Purpose**: Document the unified type organization pattern established in the marketplace domain

## Overview

This document outlines the final type system organization implemented in the marketplace domain after consolidating the old namespace-based types, contracts, context-mappers, and ACL patterns into a clean, unified structure.

## Key Principles

1. **No Namespaces**: Avoid TypeScript namespaces in favor of direct type imports
2. **gRPC-Centric**: Inter-domain communication happens via gRPC, so types reflect this reality
3. **Unified ACL**: Both inbound and outbound transformations are handled by ACL pipes
4. **Clear Boundaries**: Distinct separation between domain, internal, and gRPC types

## Directory Structure

```
domains/marketplace/contracts/
├── acl/                          # Anti-Corruption Layer pipes
│   ├── inbound/                 # gRPC → Domain transformations
│   │   ├── user.acl.ts         # User-related inbound ACLs
│   │   └── vendor.acl.ts       # Vendor-related inbound ACLs
│   ├── outbound/                # Domain → gRPC transformations (to other domains)
│   │   ├── communication.acl.ts # To communication domain
│   │   ├── infrastructure.acl.ts # To infrastructure domain
│   │   └── location.acl.ts     # To location services domain
│   ├── external/                # External API → Domain transformations
│   │   ├── clerk.acl.ts        # Clerk authentication service
│   │   ├── revenuecat.acl.ts   # RevenueCat subscription service
│   │   ├── algolia.acl.ts      # Algolia search service
│   │   └── nats.acl.ts         # NATS messaging service
│   └── acl.module.ts           # Consolidated ACL module
├── schemas/                      # Zod validation schemas
│   ├── user/
│   ├── vendor/
│   └── search/
├── types/                        # Type definitions
│   ├── domain/                  # Clean types for gRPC communication
│   │   ├── user.types.ts        # User domain types
│   │   ├── vendor.types.ts      # Vendor domain types
│   │   └── index.ts             # Barrel exports
│   ├── internal/                # Internal business logic types
│   │   ├── user.types.ts        # Rich user business types
│   │   ├── vendor.types.ts      # Rich vendor business types
│   │   ├── external.types.ts    # External service types
│   │   ├── search.types.ts      # Search functionality types
│   │   └── index.ts             # Barrel exports
│   ├── context-mapping.types.ts # Legacy namespace types (gradual migration)
│   └── index.ts                 # Main type barrel
├── utils/
├── events/
└── index.ts                     # Main contracts export
```

## Type Categories

### 1. Domain Types (`types/domain/`)

**Purpose**: Clean, canonical types that represent the domain's core entities for inter-domain communication via gRPC.

**Characteristics**:

- Simple, focused interfaces
- Represent what gRPC maps to/from
- Used for contract boundaries between domains
- No rich business logic

**Examples**:

```typescript
// types/domain/user.types.ts
export interface UserIdentity {
	id: string;
}

export interface SubscriptionCreate {
	userId: string;
	providerId: string;
	data: Record<string, unknown>;
}

// types/domain/vendor.types.ts
export interface VendorCreate {
	name: string;
	description?: string;
	email?: string;
	phone?: string;
	website?: string;
	imageUrl?: string;
	userId: string;
}

export interface Coordinates {
	lat: number;
	lng: number;
	accuracy?: number;
}
```

### 2. Internal Types (`types/internal/`)

**Purpose**: Rich business logic types used within the domain that don't necessarily cross domain boundaries.

**Characteristics**:

- Complex business logic types
- Rich data structures
- External service integration types
- Domain-specific functionality types

**Examples**:

```typescript
// types/internal/user.types.ts
export interface UserProfile {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	imageUrl?: string;
	preferences: UserPreferences;
	subscription?: UserSubscription;
	location?: UserLocation;
	createdAt: string;
	updatedAt: string;
	isActive: boolean;
}

// types/internal/external.types.ts
export interface ClerkUser {
	id: string;
	email_addresses: Array<{
		email_address: string;
		verification?: {
			status: string;
		};
	}>;
	first_name?: string;
	last_name?: string;
	image_url?: string;
	created_at: number;
	updated_at: number;
}
```

### 3. gRPC Types (Direct Imports)

**Purpose**: Protocol buffer generated types for wire communication.

**Characteristics**:

- Imported directly from `@venta/proto/*`
- No re-exports or wrapper types
- Used in ACL pipe type annotations

**Examples**:

```typescript
// Direct imports in ACL files
import type { CreateSubscriptionData, UserIdentityData } from '@venta/proto/marketplace/user-management';
import type { VendorCreateData, VendorLocationRequest } from '@venta/proto/marketplace/vendor-management';
```

## ACL (Anti-Corruption Layer) Pattern

### Unified ACL Approach

All data transformations (both inbound and outbound) are handled by ACL pipes, eliminating the old separation between "ACL" and "context-mappers".

### Inbound ACL Pipes

Transform gRPC types to domain types:

```typescript
// acl/vendor.acl.ts
@Injectable()
export class VendorCreateACLPipe implements PipeTransform<VendorCreateData, VendorCreate> {
	private validator = new SchemaValidatorPipe(GrpcVendorCreateDataSchema);

	transform(value: VendorCreateData, metadata: ArgumentMetadata): VendorCreate {
		const validated = this.validator.transform(value, metadata);

		return {
			name: validated.name,
			description: validated.description,
			email: validated.email,
			phone: validated.phone,
			website: validated.website,
			imageUrl: validated.imageUrl,
			userId: validated.userId,
		};
	}
}
```

### Outbound ACL Pipes

Transform domain types to gRPC types for other domains:

```typescript
// acl/to-location.acl.ts
@Injectable()
export class LocationVendorUpdatePipe implements PipeTransform<VendorLocationUpdate, LocationVendorLocationRequest> {
	transform(value: VendorLocationUpdate, _metadata: ArgumentMetadata): LocationVendorLocationRequest {
		if (!value.location) {
			throw AppError.validation(ErrorCodes.ERR_LOC_INVALID_COORDS, {
				vendorId: value.vendorId,
				message: 'Location data is required',
			});
		}

		return {
			vendorId: value.vendorId,
			lat: value.location.lat,
			lng: value.location.lng,
			timestamp: value.timestamp || new Date().toISOString(),
			metadata: {
				source: 'marketplace',
				accuracy: value.location.accuracy,
			},
		};
	}
}
```

### External Service ACL

Handle transformations for external services (non-gRPC):

```typescript
// acl/clerk.acl.ts
@Injectable()
export class ClerkUserTransformACLPipe implements PipeTransform<ClerkUser, User> {
	private validator = new SchemaValidatorPipe(ClerkUserSchema);

	transform(value: ClerkUser, metadata: ArgumentMetadata): User {
		const validated = this.validator.transform(value, metadata);

		return {
			id: validated.id,
			email: validated.email_addresses?.[0]?.email_address || '',
			firstName: validated.first_name || '',
			lastName: validated.last_name || '',
			imageUrl: validated.image_url || '',
			createdAt: new Date(validated.created_at).toISOString(),
			updatedAt: new Date(validated.updated_at).toISOString(),
			isActive: true,
		};
	}
}
```

## Data Flow

```
┌─────────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐
│   gRPC Types    │───▶│  Inbound ACL │───▶│ Domain Types │───▶│ Business Logic  │
│ (@venta/proto)  │    │    Pipes     │    │              │    │                 │
└─────────────────┘    └──────────────┘    └──────────────┘    └─────────────────┘
                                                 │                       │
                                                 ▼                       ▼
┌─────────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐
│   gRPC Types    │◀───│ Outbound ACL │◀───│ Domain Types │◀───│ Internal Types  │
│ (other domains) │    │    Pipes     │    │              │    │                 │
└─────────────────┘    └──────────────┘    └──────────────┘    └─────────────────┘
```

## Usage Patterns

### Import Patterns

```typescript
// gRPC types - direct from proto

// ACL pipes
import { LocationVendorUpdatePipe, VendorCreateACLPipe } from '@venta/domains/marketplace/contracts';
// Domain types - inter-domain communication
import type { UserIdentity, VendorCreate } from '@venta/domains/marketplace/contracts/types/domain';
// Internal types - rich business logic
import type { UserSubscription, VendorProfile } from '@venta/domains/marketplace/contracts/types/internal';
import type { VendorCreateData } from '@venta/proto/marketplace/vendor-management';
```

### Controller Usage

```typescript
@Controller()
export class VendorController {
	@GrpcMethod('VendorService', 'createVendor')
	@UsePipes(VendorCreateACLPipe)
	async createVendor(request: VendorCreate): Promise<VendorResponse> {
		// request is now clean domain type, validated and transformed
		return this.vendorService.createVendor(request);
	}
}
```

## Migration from Old Pattern

### What Was Removed

1. **Namespace-based types**: `Marketplace.Core.*`, `SearchDiscovery.Core.*`
2. **Separate context-mappers**: Functions like `toLocationVendorLocation()`
3. **Contract types folder**: Redundant with gRPC proto types
4. **gRPC re-export layer**: Direct imports from `@venta/proto` instead

### What Was Consolidated

1. **ACL functionality**: Inbound and outbound in same conceptual layer
2. **Type organization**: Clear domain/internal separation
3. **Import paths**: Simplified and direct
4. **Validation**: Integrated with transformation in pipes

## Benefits

1. **Simplified Mental Model**: Clear data flow and responsibilities
2. **Better Type Safety**: Direct proto imports with explicit transformations
3. **Easier Testing**: Isolated, focused pipes
4. **Consistent Pattern**: Same approach for all transformations
5. **Maintainable**: Clear separation of concerns

## Next Steps for Other Domains

1. **Copy Structure**: Use this marketplace pattern as template
2. **Migrate Types**: Move from namespace to direct types
3. **Convert Context Mappers**: Transform to outbound ACL pipes
4. **Update Imports**: Use direct proto imports
5. **Consolidate ACL**: Combine inbound/outbound in same module

## Legacy Support

The `context-mapping.types.ts` file is retained for gradual migration. It contains the old namespace-based types and should be removed once all consuming code is updated to use the new structure.

---

**Note**: This is the golden standard pattern. All other domains should be migrated to follow this same organization structure.
