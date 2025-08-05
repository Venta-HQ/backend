# Final Event System with Automatic Intellisense

## Overview

We've implemented a clean, type-safe event system that provides automatic intellisense for available events. The system automatically derives the available subjects from domain-specific event definitions.

## Architecture

### **Domain-Driven Event Definitions**

Each domain defines its events in a dedicated file:

```typescript
// libs/apitypes/src/lib/vendor/vendor.events.ts
export const VENDOR_EVENT_SUBJECTS = ['vendor.created', 'vendor.updated', 'vendor.deleted'] as const;

export const vendorEventDataSchema = z.object({
	id: z.string(),
	name: z.string(),
	// ... other fields
});

// Register with global registry
eventRegistry.register('vendor.created', vendorEventDataSchema);
eventRegistry.register('vendor.updated', vendorEventDataSchema);
eventRegistry.register('vendor.deleted', vendorEventDataSchema);
```

### **Unified Event Registry**

All domain subjects are combined into a single type:

```typescript
// libs/apitypes/src/lib/events/unified-event-registry.ts
import { VENDOR_EVENT_SUBJECTS } from '../vendor/vendor.events';

export const ALL_EVENT_SUBJECTS = [
	...VENDOR_EVENT_SUBJECTS,
	// ...USER_EVENT_SUBJECTS,
	// ...LOCATION_EVENT_SUBJECTS,
] as const;

export type AvailableEventSubjects = (typeof ALL_EVENT_SUBJECTS)[number];
```

### **Type-Safe Event Service**

The event service provides automatic intellisense:

```typescript
@Injectable()
export class EventService {
	async emit<T = any>(
		subject: AvailableEventSubjects, // ← Intellisense here!
		data: T,
		metadata?: EventMetadata,
	): Promise<void> {
		// Automatically validates against registered schema
		const schema = eventRegistry.getSchema(subject);
		const validatedData = schema ? schema.parse(data) : data;
		// ... emit event
	}
}
```

## Usage Examples

### **Simple Event Emission with Intellisense**

```typescript
// In vendor service
@Injectable()
export class VendorService {
	constructor(private eventService: EventService) {}

	async createVendor(data: VendorCreateData) {
		const vendor = await this.prisma.db.vendor.create({...});

		// TypeScript will provide intellisense for available subjects
		await this.eventService.emit('vendor.created', vendor);
		//                                    ↑ Intellisense shows: 'vendor.created' | 'vendor.updated' | 'vendor.deleted'
		return vendor.id;
	}
}
```

### **Adding New Domains**

When adding a new domain (e.g., user events):

1. **Create domain events file:**

```typescript
// libs/apitypes/src/lib/user/user.events.ts
export const USER_EVENT_SUBJECTS = ['user.created', 'user.deleted'] as const;

export const userEventDataSchema = z.object({
	userId: z.string(),
	clerkId: z.string(),
});

// Register events
eventRegistry.register('user.created', userEventDataSchema);
eventRegistry.register('user.deleted', userEventDataSchema);
```

2. **Add to unified registry:**

```typescript
// libs/apitypes/src/lib/events/unified-event-registry.ts
import { USER_EVENT_SUBJECTS } from '../user/user.events';

export const ALL_EVENT_SUBJECTS = [
	...VENDOR_EVENT_SUBJECTS,
	...USER_EVENT_SUBJECTS, // ← Add new domain
] as const;
```

3. **Use in service:**

```typescript
	await this.eventService.emit('user.created', userData);
	// Intellisense now includes: 'vendor.created' | 'vendor.updated' | 'vendor.deleted' | 'user.created' | 'user.deleted'
```

## Benefits

### **1. Automatic Intellisense**

- ✅ TypeScript provides autocomplete for available event subjects
- ✅ Compile-time validation of event subjects
- ✅ No more typos in event names

### **2. No Duplication**

- ✅ Event subjects defined once in their domain
- ✅ Automatically combined into unified type
- ✅ Single source of truth for each domain

### **3. Type Safety**

- ✅ Full TypeScript support
- ✅ Automatic schema validation
- ✅ Compile-time error checking

### **4. Easy to Extend**

- ✅ Add new domains by following the pattern
- ✅ Intellisense automatically updates
- ✅ No changes needed to existing code

### **5. Clean API**

- ✅ Simple `emit(subject, data)` interface
- ✅ Automatic validation from registry
- ✅ Optional metadata support

## File Structure

```
libs/apitypes/src/lib/
├── events/
│   ├── base.types.ts              # Shared base types
│   ├── event-registry.ts          # Global event registry
│   ├── unified-event-registry.ts  # Combined subjects type
│   └── index.ts                   # Exports
├── vendor/
│   ├── vendor.events.ts           # Vendor event definitions
│   └── index.ts                   # Exports
└── index.ts                       # Main exports
```

## Configuration

### **Module Setup**

```typescript
@Module({
	imports: [
		EventsModule, // Provides EventService
		ClientsModule.registerAsync({
			clients: [
				{
					name: 'NATS_SERVICE',
					transport: Transport.NATS,
				},
			],
		}),
	],
	providers: [VendorService],
})
export class VendorModule {}
```

## Conclusion

This event system provides:

- **Automatic intellisense** for all available events
- **Type safety** with compile-time validation
- **No duplication** with single source of truth per domain
- **Easy extensibility** for new domains
- **Clean, simple API** that's easy to use

The system automatically derives available events from domain definitions, providing the best developer experience with full TypeScript support and intellisense.
