# 🛡️ Event Pattern Enforcement Guide

## Overview

This document outlines the **type-based enforcement mechanisms** for maintaining consistent DDD event patterns across the codebase.

## Enforcement Strategy

### **Type-Based Validation (Compile-time)**

- **TypeScript enforces** DDD event naming: `domain.subdomain_action`
- **Domain boundaries** enforced at the type level
- **Valid subdomains** enforced for each domain
- **Zero runtime overhead** - all validation happens at compile time

## Valid Domains and Subdomains

### **Available Domains**

```typescript
const VALID_DOMAINS = [
	'marketplace', // Business marketplace operations
	'location', // Location and geospatial services
	'communication', // Notifications and messaging
	'infrastructure', // Cross-cutting infrastructure
	'payments', // Payment and billing operations
	'analytics', // Business intelligence and reporting
];
```

### **Domain-Subdomain Mapping**

```typescript
marketplace: ['user', 'vendor', 'search', 'reviews', 'favorites'];
location: ['geolocation', 'proximity', 'real_time', 'geofencing'];
communication: ['notifications', 'messaging', 'webhooks', 'email'];
infrastructure: ['api_gateway', 'file_management', 'monitoring', 'security'];
payments: ['processing', 'subscriptions', 'billing', 'fraud'];
analytics: ['business', 'user', 'location', 'reporting'];
```

## Event Naming Rules

### ✅ **Valid Event Names**

```typescript
'marketplace.vendor_onboarded'; // ✅ Domain + subdomain + action
'location.vendor_location_updated'; // ✅ Location domain
'marketplace.user_registered'; // ✅ User registration
'communication.notification_sent'; // ✅ Communication domain
'payments.subscription_created'; // ✅ Payments domain
'analytics.user_activity_tracked'; // ✅ Analytics domain
```

### ❌ **Invalid Event Names**

```typescript
'vendor.created'; // ❌ No domain prefix
'user.location.updated'; // ❌ Wrong domain (should be location.user_*)
'VENDOR_ONBOARDED'; // ❌ Wrong case
'vendor-onboarded'; // ❌ Wrong separator
'marketplace.invalid_subdomain_action'; // ❌ Invalid subdomain for marketplace
'nonexistent.vendor_created'; // ❌ Invalid domain
```

## Type-Based Schema Definition

### **✅ Correct Schema Definition**

```typescript
// ✅ Type-safe event schemas - TypeScript will error if you use invalid event names
export const userEventSchemas: EnforceValidDomainEvents<'marketplace'> = {
	'marketplace.user_profile_updated': createEventSchema({
		userId: z.string(),
		profileCompleteness: z.number().min(0).max(100).optional(),
		updatedFields: z.array(z.string()),
	}).withBusinessContext(['userId']),
};
```

### **❌ TypeScript Errors (Invalid Schemas)**

```typescript
// ❌ TypeScript Error: Invalid domain
export const userEventSchemas: EnforceValidDomainEvents<'marketplace'> = {
	'invalid.vendor_created': createEventSchema({}), // ❌ Type error - 'invalid' not in VALID_DOMAINS
};

// ❌ TypeScript Error: Invalid subdomain for marketplace
export const userEventSchemas: EnforceValidDomainEvents<'marketplace'> = {
	'marketplace.location_updated': createEventSchema({}), // ❌ Type error - 'location' not in marketplace subdomains
};

// ❌ TypeScript Error: Wrong domain for location events
export const userEventSchemas: EnforceValidDomainEvents<'marketplace'> = {
	'location.user_location_updated': createEventSchema({}), // ❌ Type error - 'location' domain in marketplace schema
};
```

## Business Context Requirements

### ✅ **Type-Safe Business Context**

```typescript
// ✅ TypeScript ensures only valid fields can be used for business context
const userEvent = createEventSchema({
	userId: z.string(),
	email: z.string().email(),
	profile: z.object({ firstName: z.string() }),
}).withBusinessContext(['userId']); // ✅ Only fields that exist in schema

// ❌ TypeScript Error: Invalid field
const invalidEvent = createEventSchema({
	userId: z.string(),
	email: z.string(),
}).withBusinessContext(['userId', 'nonExistentField']); // ❌ TypeScript error!
```

### ✅ **Valid Event Data (DDD Approach)**

```typescript
// ✅ Simple and clean - DDD aligned
await eventService.emit('marketplace.vendor_onboarded', {
	vendorId: vendor.id, // ✅ Automatically extracted as context
	ownerId: vendor.ownerId, // ✅ Automatically extracted as context
	businessType: 'food_vendor', // Domain concept
	location: {
		// Domain concept
		lat: vendor.location.lat,
		lng: vendor.location.lng,
	},
});

// ✅ Result: Event includes context automatically
// {
//   context: {
//     requestId: 'req-123', // ✅ Always included for correlation
//     vendorId: 'vendor-123',
//     ownerId: 'owner-456'
//   },
//   meta: {
//     eventId: 'evt-123',
//     source: 'vendor-service',
//     timestamp: '2024-01-01T00:00:00Z',
//     version: '1.0',
//     correlationId: 'req-123',
//     domain: 'marketplace',
//     subdomain: 'vendor'
//   },
//   data: { ... }
// }
```

## Enforcement Examples

### **TypeScript Compile-Time Validation**

```typescript
// ❌ TypeScript will catch invalid event names immediately
const eventName: ValidEventName = 'invalid.event'; // Type error

// ❌ TypeScript will catch non-existent events
await eventService.emit('nonexistent.event', data); // Type error

// ❌ TypeScript will catch domain boundary violations
export const schemas: EnforceValidDomainEvents<'marketplace'> = {
	'location.user_location_updated': createEventSchema({}), // Type error
};
```

## Adding New Domains

### **1. Update Event Schema Types**

```typescript
// In event-schema-types.ts
export const VALID_DOMAINS = [
	'marketplace',
	'location',
	'communication',
	'infrastructure',
	'payments',
	'analytics',
	'new_domain', // ✅ Add new domain
] as const;

export const DOMAIN_SUBDOMAINS: Record<ValidDomain, readonly string[]> = {
	// ... existing domains
	new_domain: ['subdomain1', 'subdomain2'], // ✅ Add subdomains
};
```

### **2. Create Event Schemas**

```typescript
// In new-domain.events.ts
export const newDomainEventSchemas: EnforceValidDomainEvents<'new_domain'> = {
	'new_domain.subdomain1_action': createEventSchema({
		// ✅ Valid domain and subdomain
		// ✅ Include business identifiers
		userId: z.string(),
		// ... other fields
	}).withBusinessContext(['userId']),
};
```

### **3. Update Unified Registry**

```typescript
// In unified-event-registry.ts
export const ALL_EVENT_SCHEMAS = {
	...userEventSchemas,
	...vendorEventSchemas,
	...newDomainEventSchemas, // ✅ Add new schemas
} as const;
```

## Best Practices

### 1. **Always Use EventService**

```typescript
// ✅ Correct
await this.eventService.emit('marketplace.vendor_onboarded', data);

// ❌ Wrong - direct NATS usage
await this.natsClient.emit('vendor.created', data);
```

### 2. **Include Business Context**

```typescript
// ✅ Always include business identifiers
await this.eventService.emit('marketplace.vendor_onboarded', {
	vendorId: vendor.id,
	ownerId: vendor.ownerId,
	// ... other business data
});
```

### 3. **Follow Domain Boundaries**

```typescript
// ✅ Location events in location domain
'location.vendor_location_updated';
'location.user_location_updated';

// ✅ Marketplace events in marketplace domain
'marketplace.vendor_onboarded';
'marketplace.user_registered';
```

### 4. **Use Valid Subdomains**

```typescript
// ✅ Valid subdomains for marketplace
'marketplace.user_registered';
'marketplace.vendor_onboarded';
'marketplace.search_performed';

// ❌ Invalid subdomains for marketplace
'marketplace.location_updated'; // Should be location.user_location_updated
'marketplace.payment_processed'; // Should be payments.processing_completed
```

## Troubleshooting

### **Common Issues**

1. **TypeScript Compile Errors**

   - Check that all event names use valid domains from `event-schema-types.ts`
   - Ensure subdomains are valid for the specified domain
   - Verify event name format follows `domain.subdomain_action` pattern

2. **Type Errors**

   - Import proper types from `@app/eventtypes`
   - Ensure event data includes business context
   - Check that event names exist in schemas

3. **Domain Boundary Violations**

   - Don't define location events in marketplace schemas
   - Don't define marketplace events in location schemas
   - Use the correct domain for each event type

### **Getting Help**

- Check this documentation
- Review existing event schemas in `libs/eventtypes/src/domains/`
- Look at examples in service implementations
- Check `event-schema-types.ts` for valid domains and subdomains
