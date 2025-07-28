# Event System Documentation

## Overview

The Venta Backend uses an event-driven architecture with NATS for real-time communication between services. This system ensures decoupled, scalable, and reliable service communication with provider-agnostic design.

## Event-Driven Architecture

### Why Event-Driven?

- **Decoupling**: Services don't need to know about each other
- **Real-time**: Immediate propagation of changes
- **Scalability**: Easy to add new consumers
- **Reliability**: Failed events are retried automatically
- **Extensibility**: New features can listen to existing events
- **Provider Flexibility**: Easy to switch between event providers (NATS, Redis, Kafka)

### Event Flow Example

```
1. User creates a vendor via API
   ↓
2. Vendor Service processes the request
   ↓
3. Vendor Service emits 'vendor.created' event
   ↓
4. NATS routes event to subscribers
   ↓
5. Algolia Sync Service receives the event
   ↓
6. Algolia Sync updates the search index
```

## NATS Implementation

### Core Components

#### Generic EventsService Interface

```typescript
export interface IEventsService {
	publishEvent<T>(eventType: string, data: T): Promise<void>;
	subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;
	subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<any>;
	healthCheck(): Promise<{ status: string; connected: boolean }>;
}

export interface EventMessage {
	data: any;
	timestamp: string;
	type: string;
	messageId?: string;
}
```

#### NATS Implementation

```typescript
@Injectable()
export class NatsEventsService implements IEventsService {
	async publishEvent<T>(eventType: string, data: T): Promise<void>;
	async subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;
	async subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<Subscription>;
}
```

### Provider-Agnostic Design

The system uses dependency injection to provide a generic `EventsService` that can be implemented by different providers:

```typescript
// Module configuration
@Module({
	providers: [{ provide: 'EventsService', useClass: NatsEventsService }],
	exports: ['EventsService'],
})
export class EventsModule {}

// Service usage
@Injectable()
export class VendorService {
	constructor(@Inject('EventsService') private eventsService: IEventsService) {}
}
```

### Publishing Events

```typescript
// In VendorService
await this.eventsService.publishEvent('vendor.created', {
	id: vendor.id,
	name: vendor.name,
	// ... other vendor data
});
```

### Subscribing to Events

```typescript
// In AlgoliaSyncService
await this.eventsService.subscribeToEvents(async (event) => {
	switch (event.type) {
		case 'vendor.created':
			await this.handleVendorCreated(event.data);
			break;
		case 'vendor.updated':
			await this.handleVendorUpdated(event.data);
			break;
		case 'vendor.deleted':
			await this.handleVendorDeleted(event.data);
			break;
	}
});
```

### Subject-Based Routing

NATS provides subject-based routing for better event filtering:

```typescript
// Subscribe to specific event types
await this.eventsService.subscribeToEventType('vendor.created', async (event) => {
	await this.handleVendorCreated(event.data);
});

// NATS subjects: events.vendor.created, events.vendor.updated, etc.
```

## Event Types

### Vendor Events

#### `vendor.created`

Emitted when a new vendor is created.

**Payload:**

```typescript
{
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  open: boolean;
  primaryImage?: string;
  lat?: number;
  long?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `vendor.updated`

Emitted when vendor information is updated.

**Payload:** Same as `vendor.created`

#### `vendor.deleted`

Emitted when a vendor is deleted.

**Payload:** Same as `vendor.created` (vendor data before deletion)

### Future Event Types

- `user.created` / `user.updated` / `user.deleted`
- `subscription.created` / `subscription.cancelled`
- `location.updated` (real-time location changes)

## Error Handling & Reliability

### Failed Event Storage

Events that fail to publish are stored for later processing:

```typescript
// Failed events are stored for retry
private async storeFailedEvent(eventType: string, data: any, error: any): Promise<void> {
	const failedEvent = {
		type: eventType,
		data,
		error: error.message,
		timestamp: new Date().toISOString(),
		retryCount: 0,
	};
	// Store in NATS KV store or fallback storage
}
```

### Retry Logic

#### Publishing Retries

- Failed publish attempts are stored immediately
- Events are retried on service restart
- Maximum retry count prevents infinite loops

#### Processing Retries

- Consumer services implement their own retry logic
- Exponential backoff for external service calls
- Dead letter queue for permanently failed events

### Example: Algolia Sync Retry

```typescript
private async retryOperation<T>(
  operation: () => Promise<T>,
  description: string,
  retryCount = 0,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retryCount < this.maxRetries) {
      const delay = this.retryDelay * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryOperation(operation, description, retryCount + 1);
    } else {
      throw error;
    }
  }
}
```

## Monitoring & Health Checks

### Health Endpoints

#### Service Health

```bash
# Check algolia-sync service health
curl http://localhost:5006/health

# Response
{
  "status": "ok",
  "service": "algolia-sync",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Event System Health

```bash
# Check event system status
curl http://localhost:5006/health/events

# Response
{
  "status": "ok",
  "service": "algolia-sync-events",
  "failedEventsCount": 0,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Monitoring Metrics

#### Key Metrics to Track

- **Event Throughput**: Events per second
- **Failed Events**: Count of failed event processing
- **Processing Latency**: Time from publish to consumption
- **Retry Rate**: Percentage of events requiring retries
- **NATS Connection Status**: Connection health and performance

#### Logging

```typescript
// Event published
logger.log(`Published event: ${eventType} (ID: ${event.messageId}) to ${subject}`);

// Event processed
logger.debug(`Processed event: ${event.type} (ID: ${event.messageId})`);

// Failed event
logger.error(`Failed to process event: ${event.type}`, error);
```

## Configuration

### NATS Configuration

```typescript
// Environment variables
NATS_URL=nats://localhost:4222

// Service configuration
const natsUrl = configService.get('NATS_URL', 'nats://localhost:4222');
this.nc = await connect({ servers: natsUrl });
```

### Event Service Configuration

```typescript
// Retry settings
private readonly maxRetries = 3;
private readonly retryDelay = 1000; // 1 second

// Failed events storage
private readonly failedEventsKey = 'failed_events';
```

### Docker Configuration

```yaml
# docker-compose.yml
nats:
  image: nats:2-alpine
  restart: always
  ports:
    - '4222:4222'
    - '8222:8222'
  command: nats-server --jetstream --http_port 8222
  healthcheck:
    test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:8222/healthz']
    interval: 30s
    timeout: 10s
    retries: 3
```

## Best Practices

### Event Design

1. **Keep Events Small**: Only include necessary data
2. **Use Consistent Naming**: `resource.action` format
3. **Version Events**: Consider versioning for breaking changes
4. **Include Metadata**: Timestamps, IDs, correlation IDs

### Provider-Agnostic Design

1. **Use Generic Interfaces**: `IEventsService` instead of provider-specific classes
2. **Dependency Injection**: Use `@Inject('EventsService')` for flexibility
3. **Abstract Implementation**: Keep provider details in implementation only
4. **Easy Migration**: Change only the provider binding to switch implementations

### Error Handling

1. **Always Handle Errors**: Never let unhandled exceptions crash consumers
2. **Implement Retries**: Use exponential backoff
3. **Log Failures**: Detailed logging for debugging
4. **Monitor Dead Letters**: Track permanently failed events

### Performance

1. **Batch Processing**: Process multiple events when possible
2. **Connection Pooling**: Reuse NATS connections
3. **Async Processing**: Don't block the event loop
4. **Monitor Memory**: Watch NATS memory usage

## Troubleshooting

### Common Issues

#### Events Not Being Received

1. Check NATS connection
2. Verify subscription is active
3. Check event type matching
4. Review consumer logs
5. Check NATS server health

#### High Failed Event Count

1. Check external service health (Algolia)
2. Review retry configuration
3. Monitor network connectivity
4. Check NATS server performance

#### Performance Issues

1. Monitor NATS memory and CPU
2. Check event processing latency
3. Review batch processing opportunities
4. Consider NATS clustering

### Debug Commands

```bash
# Check NATS server status
curl http://localhost:8222/healthz

# Check NATS server info
curl http://localhost:8222/varz

# Check NATS connections
curl http://localhost:8222/connz

# Monitor NATS traffic
nats-sub "events.*"
```

## Migration Path

### Current: NATS

- **Pros**: Persistence, subject-based routing, clustering, provider-agnostic
- **Cons**: Additional infrastructure complexity
- **Best for**: Current scale, real-time requirements, future flexibility

### Future: Kafka

- **When**: Enterprise scale, complex streaming, exactly-once delivery
- **Benefits**: Exactly-once delivery, partitioning, schema registry
- **Migration**: Replace NATS implementation, keep same interface

### Provider Migration

To switch from NATS to another provider (e.g., Redis, Kafka):

1. **Create new implementation** implementing `IEventsService`
2. **Update module provider**:
   ```typescript
   { provide: 'EventsService', useClass: NewEventsService }
   ```
3. **No changes needed** in business logic or service code

This design ensures zero downtime migrations and complete provider flexibility.
