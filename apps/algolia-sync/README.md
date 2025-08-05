# Algolia Sync Service

## Purpose

The Algolia Sync Service is a microservice that synchronizes vendor data with Algolia search index. It listens for vendor-related events and automatically updates the Algolia index to keep it in sync with the database.

## Architecture

This service uses **NestJS Microservices** with NATS transport for event-driven communication. It leverages the `@EventPattern()` decorator for declarative event handling, which provides:

- **Automatic lifecycle management** - no manual cleanup needed
- **Built-in error handling** and retry mechanisms  
- **Type safety** with automatic serialization/deserialization
- **Less boilerplate** - just decorate methods
- **Standard NestJS patterns** - easier for new developers

## Event Handlers

The service listens for the following vendor events:

- `vendor.created` - Creates a new vendor record in Algolia
- `vendor.updated` - Updates an existing vendor record in Algolia
- `vendor.deleted` - Removes a vendor record from Algolia
- `vendor.location.updated` - Updates vendor location in Algolia

## Implementation

```typescript
@EventPattern('vendor.created')
async handleVendorCreated(vendor: Record<string, unknown>) {
  // Handle vendor creation
}

@EventPattern('vendor.updated') 
async handleVendorUpdated(vendor: Record<string, unknown>) {
  // Handle vendor updates
}
```

## Configuration

The service is configured as a NATS microservice with:
- **Transport**: NATS
- **Queue**: `algolia-sync` (for load balancing)
- **Server**: Configurable via `NATS_URL` environment variable

## Dependencies

- **AlgoliaService**: For interacting with Algolia search index
- **NATS**: For event-driven communication
- **NestJS Microservices**: For event pattern handling

## Benefits of This Approach

1. **Declarative**: Event handlers are clearly defined with decorators
2. **Maintainable**: Less custom code to maintain
3. **Scalable**: Automatic queue management for load balancing
4. **Type-safe**: Built-in serialization/deserialization
5. **Standard**: Uses NestJS best practices 