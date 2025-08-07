# API Types Library

## Purpose

The API Types library provides centralized type definitions, schemas, and validation for the Venta backend system. It ensures type safety and consistency across all microservices by providing a single source of truth for all API-related types.

## Overview

This library provides:
- **Domain-specific types** organized by business domain following DDD principles
- **Shared types** for common functionality across domains
- **Validation schemas** using Zod for runtime type checking
- **Protocol buffer types** for gRPC communication
- **Helper functions** for common type operations
- **DDD-aligned structure** reflecting business domains

## Organization

### Domain Structure

```
libs/apitypes/src/
├── domains/
│   ├── marketplace/           # Marketplace domain types
│   │   ├── user/
│   │   │   ├── user.schemas.ts
│   │   │   └── index.ts
│   │   ├── vendor/
│   │   │   ├── vendor.schemas.ts
│   │   │   └── index.ts
│   │   ├── subscription/
│   │   │   ├── subscription.types.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── location-services/     # Location services domain types
│   │   ├── location.schemas.ts
│   │   ├── location.types.ts
│   │   └── index.ts
│   ├── communication/         # Communication domain types
│   │   └── index.ts           # Placeholder for future types
│   └── infrastructure/        # Infrastructure domain types
│       └── index.ts           # Placeholder for future types
├── shared/
│   └── helpers/               # Shared helper functions
│       ├── helpers.ts
│       └── index.ts
└── index.ts                   # Main export file
```

### Domain Organization

Each domain contains:
- **Schemas**: Zod validation schemas for request/response validation
- **Types**: TypeScript type definitions
- **Index**: Domain-specific exports

### DDD Domain Structure

The library follows the established DDD domains:

- **Marketplace**: User management, vendor management, and subscription types
- **Location Services**: Location tracking and geospatial types
- **Communication**: Webhook and messaging types
- **Infrastructure**: System and operational types

## Usage

### Importing Domain Types

```typescript
import { 
  UserCreateSchema, 
  UserUpdateSchema,
  UserResponseSchema 
} from '@app/apitypes';

// Use schemas for validation
const validatedData = UserCreateSchema.parse(requestBody);
```

### Importing Domain-Specific Types

```typescript
import { 
  VendorCreateData,
  VendorUpdateData,
  VendorProfile 
} from '@app/apitypes/domains/marketplace/vendor';

// Type-safe vendor operations
function updateVendor(id: string, data: VendorUpdateData): Promise<VendorProfile> {
  // TypeScript ensures correct data structure
}
```

### Importing Shared Types

```typescript
import { 
  GrpcLocationUpdateSchema,
  VendorLocationRequestSchema 
} from '@app/apitypes/domains/location-services';

// Use location-specific schemas
const locationData = GrpcLocationUpdateSchema.parse(requestBody);
```

## Event Types

**Note**: Event types have been moved to the dedicated `@app/eventtypes` library for better separation of concerns.

```typescript
// Import event types from the dedicated library
import { 
  EventDataMap, 
  AvailableEventSubjects,
  ALL_EVENT_SCHEMAS 
} from '@app/eventtypes';

// Type-safe event emission
await eventService.emit('vendor.created', {
  id: 'vendor-123',
  name: 'My Vendor',
  // TypeScript ensures all required fields are provided
});
```

## Benefits

- **DDD-aligned organization** reflecting business domains
- **Type safety** across all microservices
- **Centralized validation** with Zod schemas
- **Consistent patterns** for all API types
- **Easy discovery** of available types by domain
- **Reduced duplication** through shared types
- **Clear separation** between API types and event types
- **Business-focused structure** that domain experts can understand 