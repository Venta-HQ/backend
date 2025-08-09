# EventTypes Library

## Purpose

The EventTypes library provides shared event types and utilities that are used across multiple domains in the Venta backend system. This library focuses on truly shared, non-domain-specific event types and utilities that are needed by multiple parts of the system.

## Overview

This library provides:

- **Shared event types** for common event patterns
- **Event utilities** for event handling and validation
- **Base event interfaces** for consistent event structure
- **Cross-domain event utilities** for shared functionality

## Organization

### Library Structure

```
libs/eventtypes/src/
├── shared/                   # Shared utilities and types
│   ├── base.types.ts        # Base event interfaces
│   ├── event-schema-types.ts # Event schema types
│   └── index.ts             # Shared exports
└── index.ts                 # Main exports
```

### Domain-Specific Events

Domain-specific events have been moved to their respective domain folders:

- Marketplace events → `domains/marketplace/events`
- Location Services events → `domains/location-services/events`
- Communication events → `domains/communication/events`
- Infrastructure events → `domains/infrastructure/events`

## Usage

### Base Event Interface

```typescript
import { BaseEvent } from '@venta/eventtypes';

interface MyEvent extends BaseEvent {
	data: {
		// Event-specific data
	};
}
```

### Event Utilities

```typescript
import {
  createEventSchema,
  validateEventName,
  extractEventContext
} from '@venta/eventtypes/shared';

// Use shared event utilities
const schema = createEventSchema({...});
const context = extractEventContext(event);
```

## Benefits

- **Clear separation** between shared and domain-specific events
- **Reduced duplication** through shared utilities
- **Consistent patterns** for event handling
- **Type safety** across all microservices
- **Focused scope** on truly shared functionality
- **Better maintainability** through proper separation of concerns

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

---

**Status**: ✅ **Production Ready**  
**Last Updated**: December 2024  
**Version**: 1.0.0
