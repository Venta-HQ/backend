# Event Types Library

## Purpose

The Event Types Library provides centralized type definitions and schemas for all domain events in the Venta backend system. It serves as the single source of truth for event data structures, ensuring type safety and consistency across all microservices.

## Overview

This library provides:

- **Domain-specific event schemas** using Zod for runtime validation
- **Type-safe event data types** for compile-time type checking
- **Unified event registry** for all available events
- **Event data mappings** that combine schemas and types
- **Consistent event patterns** across all domains

## Structure

```
src/
├── domains/
│   ├── user/
│   │   ├── user.events.ts          # User domain event schemas and types
│   │   └── user.event-map.ts       # User event data mappings
│   ├── vendor/
│   │   ├── vendor.events.ts        # Vendor domain event schemas and types
│   │   └── vendor.event-map.ts     # Vendor event data mappings
│   └── location/
│       ├── location.events.ts      # Location domain event schemas and types
│       └── location.event-map.ts   # Location event data mappings
├── shared/
│   └── unified-event-registry.ts   # Combined event registry and mappings
└── index.ts                        # Main exports
```

## Usage

### Import Event Types

```typescript
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

### Domain-Specific Imports

```typescript
import { VendorEventData } from '@app/eventtypes/domains/vendor';
import { UserLocationUpdateEventData } from '@app/eventtypes/domains/user';
```

## Event Schema Pattern

Each domain follows a consistent pattern:

```typescript
// 1. Define Zod schema
export const vendorEventDataSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  // ... other fields
});

// 2. Define properly-typed data structure
export type VendorEventData = z.infer<typeof vendorEventDataSchema> & 
  Required<Pick<z.infer<typeof vendorEventDataSchema>, 'id'>>;

// 3. Define event schemas mapping
export const vendorEventSchemas = {
  'vendor.created': vendorEventDataSchema,
  'vendor.updated': vendorEventDataSchema,
  // ... other events
} as const;

// 4. Define event data mapping
export type VendorEventDataMap = {
  'vendor.created': VendorEventData;
  'vendor.updated': VendorEventData;
  // ... other events
};
```

## Benefits

- **Single Source of Truth**: All event definitions in one place
- **Type Safety**: Compile-time validation of event data
- **Runtime Validation**: Zod schemas ensure data integrity
- **Maintainability**: Clear separation by domain
- **Consistency**: Standardized patterns across all events
- **Discoverability**: Easy to find and understand available events 