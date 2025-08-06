# API Types Library

## Purpose

The API Types library provides centralized type definitions, schemas, and validation for the Venta backend system. It ensures type safety and consistency across all microservices by providing a single source of truth for all API-related types.

## Overview

This library provides:
- **Domain-specific types** organized by business domain
- **Shared types** for common functionality across domains
- **Event schemas** for type-safe event publishing and consumption
- **Validation schemas** using Zod for runtime type checking
- **Protocol buffer types** for gRPC communication
- **Helper functions** for common type operations

## Organization

### Domain Structure

```
libs/apitypes/src/
├── domains/
│   ├── user/              # User domain types
│   │   ├── user.schemas.ts
│   │   └── index.ts
│   ├── vendor/            # Vendor domain types
│   │   ├── vendor.schemas.ts
│   │   ├── vendor.events.ts
│   │   └── index.ts
│   ├── location/          # Location domain types
│   │   ├── location.schemas.ts
│   │   └── index.ts
│   └── subscription/      # Subscription domain types
│       ├── subscription.types.ts
│       └── index.ts
├── shared/
│   ├── events/            # Shared event types
│   │   ├── base.types.ts
│   │   ├── unified-event-registry.ts
│   │   └── index.ts
│   └── helpers/           # Shared helper functions
│       ├── helpers.ts
│       └── index.ts
└── index.ts               # Main export file
```

### Domain Organization

Each domain contains:
- **Schemas**: Zod validation schemas for request/response validation
- **Types**: TypeScript type definitions
- **Events**: Domain-specific event types and schemas
- **Index**: Domain-specific exports

### Shared Organization

Shared components include:
- **Events**: Common event types and registry
- **Helpers**: Utility functions for type operations

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

### Importing Event Types

```typescript
import { 
  VendorCreatedEvent,
  VendorUpdatedEvent,
  VendorDeletedEvent 
} from '@app/apitypes';

// Type-safe event handling
function handleVendorEvent(event: VendorCreatedEvent) {
  // TypeScript knows the exact structure
}
```

### Importing Shared Types

```typescript
import { 
  BaseEvent,
  EventMetadata,
  AvailableEventSubjects 
} from '@app/apitypes';

// Use shared event types
const event: BaseEvent = {
  eventId: 'uuid',
  timestamp: new Date().toISOString(),
  // ... other properties
};
```

## Benefits

- **Domain-driven organization** for better maintainability
- **Type safety** across all microservices
- **Centralized validation** with Zod schemas
- **Consistent patterns** for all API types
- **Easy discovery** of available types by domain
- **Reduced duplication** through shared types 