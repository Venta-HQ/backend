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
- **DDD-aligned structure** following domain-driven design principles

## Structure

```
src/
├── domains/
│   ├── marketplace/              # Marketplace domain events
│   │   ├── user/
│   │   │   └── user.events.ts    # User domain event schemas and types
│   │   └── vendor/
│   │       └── vendor.events.ts  # Vendor domain event schemas and types
│   ├── location-services/        # Location services domain events
│   │   └── index.ts              # Location domain exports (placeholder)
│   ├── communication/            # Communication domain events
│   │   └── index.ts              # Communication domain exports (placeholder)
│   └── infrastructure/           # Infrastructure domain events
│       └── index.ts              # Infrastructure domain exports (placeholder)
├── shared/
│   ├── base.types.ts             # Base event interfaces and types
│   └── unified-event-registry.ts # Combined event registry and mappings
└── index.ts                      # Main exports
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
import { VendorEventData } from '@app/eventtypes/domains/marketplace/vendor';
import { UserLocationUpdateEventData } from '@app/eventtypes/domains/marketplace/user';
```

## Event Schema Pattern

Each domain follows a consistent pattern:

```typescript
// 1. Define Zod schema
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

// 2. Define event data mapping
export type VendorEventDataMap = {
  'vendor.created': z.infer<typeof vendorEventSchemas['vendor.created']>;
  'vendor.updated': z.infer<typeof vendorEventSchemas['vendor.updated']>;
  'vendor.deleted': z.infer<typeof vendorEventSchemas['vendor.deleted']>;
};
```

## DDD Domain Structure

The library follows the established DDD domains:

- **Marketplace**: User and vendor management events
- **Location Services**: Location tracking and geospatial events
- **Communication**: Webhook and messaging events
- **Infrastructure**: System and operational events

## Benefits

- **Single Source of Truth**: All event definitions in one place
- **Type Safety**: Compile-time validation of event data
- **Runtime Validation**: Zod schemas ensure data integrity
- **Maintainability**: Clear separation by domain
- **Consistency**: Standardized patterns across all events
- **Discoverability**: Easy to find and understand available events
- **DDD Alignment**: Structure reflects business domains
- **Centralized Management**: All event-related types in one library 