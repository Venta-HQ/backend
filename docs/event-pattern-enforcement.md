# Event Pattern Enforcement

This document describes how we enforce consistent event naming patterns and domain boundaries in our DDD architecture.

## Overview

We use **type-based validation** to enforce event naming patterns at compile-time, ensuring all events follow our DDD conventions and domain boundaries are respected.

## 🎯 Event Naming Convention

### Pattern: `domain.subdomain_action`

```typescript
// ✅ Valid DDD Event Names
'marketplace.vendor_onboarded'; // Domain: marketplace, Subdomain: vendor, Action: onboarded
'location.vendor_location_updated'; // Domain: location, Subdomain: vendor, Action: location_updated
'marketplace.user_registered'; // Domain: marketplace, Subdomain: user, Action: registered
'location.user_location_updated'; // Domain: location, Subdomain: user, Action: location_updated
```

### Domain Structure

```typescript
// Valid domains and their subdomains
const DOMAIN_SUBDOMAINS = {
	marketplace: ['user', 'vendor', 'search', 'subscription'],
	location: ['vendor', 'user', 'geolocation'],
} as const;
```

## 🔧 Type-Based Validation

### Compile-Time Enforcement

We use TypeScript template literal types to enforce event patterns at compile-time:

```typescript
// Type definition for valid event names
type ValidEventNamePattern<TDomain extends keyof typeof DOMAIN_SUBDOMAINS> =
	`${TDomain}.${DOMAIN_SUBDOMAINS[TDomain][number]}_${string}`;

// Enforce valid domain events
type EnforceValidDomainEvents<TDomain extends keyof typeof DOMAIN_SUBDOMAINS> = {
	[K in ValidEventNamePattern<TDomain>]: z.ZodType<any>;
};
```

### Usage in Event Schemas

```typescript
// ✅ Correct: Type-safe event schema
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
} as const satisfies EnforceValidDomainEvents<'marketplace'>;
```

### Compile-Time Errors

```typescript
// ❌ This will cause a compile-time error
export const invalidEventSchemas = {
	'invalid.event_name': z.object({}), // Type error: not a valid event pattern
	'marketplace.invalid_action': z.object({}), // Type error: invalid subdomain
} as const satisfies EnforceValidDomainEvents<'marketplace'>;
```

## 🏗️ Schema-Driven Context Extraction

### Automatic Business Context

Events automatically extract business context from their Zod schemas:

```typescript
// Schema with context configuration
'marketplace.vendor_onboarded': createEventSchema({
  vendorId: z.string(),
  ownerId: z.string(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  timestamp: z.string().default(() => new Date().toISOString()),
}).withContext(['vendorId', 'ownerId']), // Specify fields for correlation
```

### Context Extraction Process

```typescript
// EventService automatically extracts context
private extractContextFromSchema(subject: string, data: any): Record<string, any> {
  const schema = ALL_EVENT_SCHEMAS[subject];
  if (!schema || !schema._context) {
    return {};
  }

  const context: Record<string, any> = {};
  for (const field of schema._context.fields) {
    if (data[field] !== undefined) {
      context[field] = data[field];
    }
  }
  return context;
}
```

## 📋 Event Structure

### BaseEvent Interface

```typescript
export interface BaseEvent {
	context?: Record<string, any>; // Business context for correlation
	meta: {
		eventId: string; // Unique event identifier
		source: string; // Service that emitted the event
		timestamp: string; // ISO timestamp
		version: string; // Event schema version
		correlationId?: string; // Request correlation ID
		domain?: string; // Extracted from event name
		subdomain?: string; // Extracted from event name
	};
	data: any; // Validated event data
}
```

### Event Emission

```typescript
// Simple emission with automatic context
await this.eventService.emit('marketplace.vendor_onboarded', {
	vendorId: vendor.id,
	ownerId: vendor.ownerId,
	location: onboardingData.location,
});

// Automatically creates:
// {
//   context: { vendorId: "123", ownerId: "456" },
//   meta: {
//     eventId: "uuid",
//     source: "vendor-management",
//     timestamp: "2024-12-01T10:00:00Z",
//     version: "1.0",
//     correlationId: "req-123",
//     domain: "marketplace",
//     subdomain: "vendor"
//   },
//   data: { vendorId: "123", ownerId: "456", location: {...} }
// }
```

## 🔍 Validation Examples

### Valid Event Patterns

```typescript
// ✅ All of these are valid and will compile
'marketplace.vendor_onboarded';
'marketplace.vendor_profile_updated';
'marketplace.vendor_deactivated';
'location.vendor_location_updated';
'location.user_location_updated';
'marketplace.user_registered';
'marketplace.user_profile_updated';
```

### Invalid Event Patterns

```typescript
// ❌ These will cause compile-time errors
'invalid.event_name'; // Invalid domain
'marketplace.invalid_action'; // Invalid subdomain
'location.vendor.invalid'; // Wrong pattern
'vendor.onboarded'; // Missing domain prefix
```

## 🛠️ Implementation Details

### Event Schema Creation

```typescript
// Fluent API for creating event schemas
export function createEventSchema<T extends z.ZodRawShape>(shape: T) {
	const baseSchema = z.object(shape);
	const schema = baseSchema as unknown as ContextSchema<z.infer<typeof baseSchema>>;

	schema.withContext = function <Fields extends keyof z.infer<typeof baseSchema>>(fields: Fields[]) {
		this._context = { fields: fields as string[] };
		return this;
	};

	return schema;
}
```

### Type Safety

```typescript
// Type-safe event emission
export class EventService {
	async emit<TSubject extends keyof EventDataMap>(subject: TSubject, data: EventDataMap[TSubject]): Promise<void> {
		// Compile-time validation ensures:
		// 1. Subject is a valid event name
		// 2. Data matches the schema for that event
		// 3. Context is automatically extracted
	}
}
```

## 📊 Benefits

### Compile-Time Safety

- **No runtime errors** from invalid event names
- **Type-safe event data** with automatic validation
- **IDE support** with autocomplete and error detection

### Business Alignment

- **Consistent naming** across all domains
- **Clear domain boundaries** enforced by types
- **Business context** automatically extracted

### Developer Experience

- **Fluent API** for schema creation
- **Automatic context extraction** from schemas
- **Rich TypeScript support** with full type inference

## 🔧 Configuration

### Adding New Domains

```typescript
// 1. Add domain to VALID_DOMAINS
const VALID_DOMAINS = ['marketplace', 'location', 'newdomain'] as const;

// 2. Add subdomains to DOMAIN_SUBDOMAINS
const DOMAIN_SUBDOMAINS = {
	marketplace: ['user', 'vendor', 'search'],
	location: ['vendor', 'user', 'geolocation'],
	newdomain: ['subdomain1', 'subdomain2'], // New domain
} as const;

// 3. Create event schemas with type enforcement
export const newDomainEventSchemas = {
	'newdomain.subdomain1_action': createEventSchema({
		// schema definition
	}).withContext(['field1', 'field2']),
} as const satisfies EnforceValidDomainEvents<'newdomain'>;
```

### Adding New Events

```typescript
// Simply add to existing schema object
export const vendorEventSchemas = {
  'marketplace.vendor_onboarded': createEventSchema({...}),
  'marketplace.vendor_profile_updated': createEventSchema({...}),
  'marketplace.vendor_deactivated': createEventSchema({...}),
  // ✅ New event - automatically type-checked
  'marketplace.vendor_reactivated': createEventSchema({
    vendorId: z.string(),
    reactivationReason: z.string(),
    timestamp: z.string().default(() => new Date().toISOString()),
  }).withContext(['vendorId']),
} as const satisfies EnforceValidDomainEvents<'marketplace'>;
```

## 🎯 Best Practices

### Event Naming

- Use **business terminology** in event names
- Follow **consistent patterns** across domains
- Make names **descriptive and specific**

### Context Configuration

- Include **business identifiers** in context (userId, vendorId, etc.)
- Avoid **sensitive data** in context fields
- Keep context **focused and relevant**

### Schema Design

- Use **smart defaults** for common fields (timestamps)
- Include **validation rules** for data integrity
- Make schemas **comprehensive but not bloated**

---

**Status**: ✅ **IMPLEMENTED**  
**Last Updated**: December 2024  
**Enforcement**: Compile-time type validation
