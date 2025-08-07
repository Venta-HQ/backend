# EventTypes Library

Centralized event schema definitions and type management for the Venta backend system.

## Overview

The `eventtypes` library provides a centralized, type-safe approach to defining and managing domain events across all services. It enforces DDD (Domain-Driven Design) patterns and ensures consistent event naming and structure.

## Features

- **Type-safe event schemas** using Zod validation
- **DDD event naming** with domain boundaries enforced at compile-time
- **Automatic context extraction** from event schemas
- **Centralized event registry** for all domains
- **Compile-time validation** of event patterns and domain boundaries

## Architecture

### Domain Organization

```
libs/eventtypes/src/
├── domains/
│   ├── marketplace/           # Business marketplace operations
│   │   ├── vendor/           # Vendor management events
│   │   └── user/             # User management events
│   └── location-services/    # Location and geospatial events
├── shared/                   # Shared utilities and types
└── index.ts                 # Main exports
```

### Event Naming Convention

Events follow the pattern: `domain.subdomain.action`

```typescript
// Examples
'marketplace.vendor.onboarded'     // Domain: marketplace, Subdomain: vendor, Action: onboarded
'location.vendor.location_updated' // Domain: location, Subdomain: vendor, Action: location_updated
'marketplace.user.registered'      // Domain: marketplace, Subdomain: user, Action: registered
```

## Usage

### Defining Event Schemas

```typescript
import { z } from 'zod';
import { createEventSchema, EnforceValidDomainEvents } from '@app/eventtypes';

// Define vendor events with type enforcement
export const vendorEventSchemas = {
  'marketplace.vendor_onboarded': createEventSchema({
    vendorId: z.string(),
    ownerId: z.string(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    timestamp: z.string().default(() => new Date().toISOString()),
  }).withContext(['vendorId', 'ownerId']),
  
  'marketplace.vendor_profile_updated': createEventSchema({
    vendorId: z.string(),
    updatedFields: z.array(z.string()),
    timestamp: z.string().default(() => new Date().toISOString()),
  }).withContext(['vendorId']),
} as const satisfies EnforceValidDomainEvents<'marketplace'>;
```

### Emitting Events

```typescript
import { EventService } from '@app/nest/modules/messaging/events';

export class VendorService {
  constructor(private eventService: EventService) {}

  async onboardVendor(data: VendorOnboardingData): Promise<string> {
    const vendor = await this.createVendor(data);
    
    // Emit domain event with automatic context
    await this.eventService.emit('marketplace.vendor_onboarded', {
      vendorId: vendor.id,
      ownerId: vendor.ownerId,
      location: data.location,
    });

    return vendor.id;
  }
}
```

### Consuming Events

```typescript
import { BaseEvent } from '@app/eventtypes';

export class AlgoliaSyncController {
  async handleVendorOnboarded(event: BaseEvent): Promise<void> {
    const { vendorId, ownerId, location } = event.data;
    
    // Process the event with full context
    await this.algoliaService.indexVendor({
      vendorId,
      ownerId,
      location,
    });
  }
}
```

## Event Structure

### BaseEvent Interface

```typescript
export interface BaseEvent {
  context?: Record<string, any>;     // Business context for correlation
  meta: {
    eventId: string;                 // Unique event identifier
    source: string;                  // Service that emitted the event
    timestamp: string;               // ISO timestamp
    version: string;                 // Event schema version
    correlationId?: string;          // Request correlation ID
    domain?: string;                 // Extracted from event name
    subdomain?: string;              // Extracted from event name
  };
  data: any;                         // Validated event data
}
```

### Automatic Context Extraction

Events automatically extract business context from their schemas:

```typescript
// Schema with context configuration
'marketplace.vendor.onboarded': createEventSchema({
  vendorId: z.string(),
  ownerId: z.string(),
  // ... other fields
}).withContext(['vendorId', 'ownerId']), // Specify fields for correlation

// Automatically creates context:
// {
//   context: { vendorId: "123", ownerId: "456" },
//   meta: { eventId: "uuid", source: "vendor-management", ... },
//   data: { vendorId: "123", ownerId: "456", ... }
// }
```

## Type Safety

### Compile-Time Validation

The library enforces event patterns at compile-time using TypeScript template literal types:

```typescript
// ✅ Valid - will compile
'marketplace.vendor.onboarded'
'location.vendor.location_updated'

// ❌ Invalid - will cause compile-time error
'invalid.event_name'           // Invalid domain
'marketplace.invalid.action'   // Invalid subdomain
'vendor.onboarded'             // Missing domain prefix
```

### Domain Boundaries

Valid domains and subdomains are enforced:

```typescript
const DOMAIN_SUBDOMAINS = {
  marketplace: ['user', 'vendor', 'search', 'subscription'],
  location: ['vendor', 'user', 'geolocation'],
} as const;
```

## Available Events

### Marketplace Domain

#### Vendor Events
- `marketplace.vendor_onboarded` - New vendor registration
- `marketplace.vendor_profile_updated` - Vendor profile changes
- `marketplace.vendor_deactivated` - Vendor deactivation

#### User Events
- `marketplace.user_registered` - New user registration
- `marketplace.user_profile_updated` - User profile changes

### Location Services Domain

#### Location Events
- `location.vendor_location_updated` - Vendor location changes
- `location.user_location_updated` - User location changes

## Adding New Events

### 1. Define the Schema

```typescript
// In the appropriate domain file
export const newEventSchemas = {
  'marketplace.vendor_reactivated': createEventSchema({
    vendorId: z.string(),
    reactivationReason: z.string(),
    timestamp: z.string().default(() => new Date().toISOString()),
  }).withContext(['vendorId']),
} as const satisfies EnforceValidDomainEvents<'marketplace'>;
```

### 2. Update the Registry

```typescript
// In unified-event-registry.ts
export const ALL_EVENT_SCHEMAS = {
  ...vendorEventSchemas,
  ...newEventSchemas, // Add new schemas
} as const;
```

### 3. Use in Services

```typescript
// Emit the new event
await this.eventService.emit('marketplace.vendor_reactivated', {
  vendorId: vendor.id,
  reactivationReason: 'Owner request',
});
```

## Best Practices

### Event Naming
- Use **business terminology** in event names
- Follow **consistent patterns** across domains
- Make names **descriptive and specific**

### Schema Design
- Include **business identifiers** in context fields
- Use **smart defaults** for common fields (timestamps)
- Include **validation rules** for data integrity
- Keep schemas **comprehensive but not bloated**

### Context Configuration
- Include **business identifiers** in context (userId, vendorId, etc.)
- Avoid **sensitive data** in context fields
- Keep context **focused and relevant**

## Development

### Building

```bash
# Build the library
pnpm build eventtypes

# Type check
pnpm type-check eventtypes
```

### Testing

```bash
# Run tests
pnpm test eventtypes

# Run tests with coverage
pnpm test:cov eventtypes
```

## Related Documentation

- [DDD Migration Guide](../../docs/ddd-migration-guide.md) - Complete DDD implementation overview
- [Event Pattern Enforcement](../../docs/event-pattern-enforcement.md) - Event validation patterns
- [Service Integration](../../docs/service-integration.md) - How to integrate with services

---

**Status**: ✅ **Production Ready**  
**Last Updated**: December 2024  
**Version**: 1.0.0 