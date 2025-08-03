# Event Sourcing Implementation

## Overview

The Venta Backend now includes a comprehensive event sourcing system that tracks all state changes through events, providing audit trails, event replay capabilities, and state reconstruction. This system enhances the existing NATS-based event system with domain-driven design principles.

## What is Event Sourcing?

Event sourcing is a pattern where all changes to application state are stored as a sequence of events. Instead of storing just the current state, we store every event that led to that state. This provides:

- **Complete Audit Trail**: Every change is recorded with who, what, when, and why
- **Event Replay**: Rebuild state from any point in time
- **Temporal Queries**: Query data as it existed at any point in the past
- **Debugging**: Understand exactly how the system reached its current state
- **Compliance**: Meet regulatory requirements for data retention and audit

## Architecture

### Enhanced Event Message Structure

```typescript
interface EventMessage {
  data: any;                    // Event payload
  timestamp: string;            // When the event occurred
  type: string;                 // Event type (e.g., 'user.created')
  messageId?: string;           // Unique event identifier
  
  // Event sourcing fields
  aggregateId?: string;         // Domain aggregate ID (e.g., user ID)
  aggregateType?: string;       // Type of aggregate (e.g., 'user', 'vendor')
  version?: number;             // Event version for optimistic concurrency
  correlationId?: string;       // For tracing related events
  causationId?: string;         // ID of the event that caused this event
  userId?: string;              // Who triggered the event
  metadata?: Record<string, any>; // Additional context
}
```

### Event Sourcing Service Interface

```typescript
interface IEventsService {
  // Standard event methods
  publishEvent<T>(eventType: string, data: T, options?: Partial<EventMessage>): Promise<void>;
  subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;
  
  // Event sourcing methods
  getEventsForAggregate(aggregateId: string, aggregateType: string): Promise<EventMessage[]>;
  replayEvents(options: EventReplayOptions): Promise<EventMessage[]>;
  getEventHistory(aggregateId?: string, aggregateType?: string): Promise<EventMessage[]>;
  reconstructState<T>(aggregateId: string, aggregateType: string, initialState: T, reducer: (state: T, event: EventMessage) => T): Promise<T>;
}
```

## Implementation Details

### 1. Aggregate Versioning

Each aggregate (user, vendor, etc.) maintains a version number that increments with each event:

```typescript
// Automatic version management
if (event.aggregateId && event.aggregateType) {
  const aggregateKey = `${event.aggregateType}:${event.aggregateId}`;
  const currentVersion = this.aggregateVersions.get(aggregateKey) || 0;
  event.version = currentVersion + 1;
  this.aggregateVersions.set(aggregateKey, event.version);
}
```

### 2. Event Storage

Events are stored in-memory for development (in production, use JetStream or external store):

```typescript
private eventStore: Map<string, EventMessage[]> = new Map();
private aggregateVersions: Map<string, number> = new Map();
```

### 3. Event Retention

Configurable retention policy to manage storage:

```typescript
interface EventSourcingOptions {
  enableAuditLog?: boolean;
  enableEventReplay?: boolean;
  enableStateReconstruction?: boolean;
  eventRetentionDays?: number;  // Default: 30 days
}
```

## Usage Examples

### Publishing Events with Event Sourcing

```typescript
// User service
await this.eventsService.publishEvent('user.created', {
  userId: user.id,
  clerkId: user.clerkId,
  timestamp: new Date().toISOString(),
}, {
  aggregateId: user.id,
  aggregateType: 'user',
  userId: clerkId, // Who triggered the event
  metadata: {
    source: 'clerk',
    clerkId: clerkId
  }
});

// Vendor service
await this.eventsService.publishEvent('vendor.updated', vendorData, {
  aggregateId: vendor.id,
  aggregateType: 'vendor',
  userId: vendor.ownerId,
  metadata: {
    eventType: 'vendor.updated',
    vendorName: vendor.name,
    hasLocation: !!(vendor.lat && vendor.long)
  }
});
```

### Event Replay

```typescript
// Replay all events for a specific user
const userEvents = await this.eventsService.replayEvents({
  aggregateId: 'user-123',
  aggregateType: 'user'
});

// Replay specific event types
const userCreationEvents = await this.eventsService.replayEvents({
  eventTypes: ['user.created', 'user.updated']
});

// Replay events within a time range
const recentEvents = await this.eventsService.replayEvents({
  fromTimestamp: '2024-01-01T00:00:00Z',
  toTimestamp: '2024-01-31T23:59:59Z'
});
```

### State Reconstruction

```typescript
// Define a reducer function
const userReducer = (state: any, event: EventMessage) => {
  switch (event.type) {
    case 'user.created':
      return { ...state, ...event.data, createdAt: event.timestamp };
    case 'user.updated':
      return { ...state, ...event.data, updatedAt: event.timestamp };
    case 'user.deleted':
      return { ...state, deletedAt: event.timestamp, isDeleted: true };
    default:
      return state;
  }
};

// Reconstruct user state
const userState = await this.eventsService.reconstructState(
  'user-123',
  'user',
  { name: '', email: '' },
  userReducer
);
```

## API Endpoints

The gateway provides REST endpoints for event sourcing operations:

### Get Event History

```http
GET /events/history?aggregateId=user-123&aggregateType=user
```

Response:
```json
{
  "aggregateId": "user-123",
  "aggregateType": "user",
  "totalEvents": 3,
  "events": [
    {
      "id": "event-1",
      "type": "user.created",
      "timestamp": "2024-01-01T10:00:00Z",
      "version": 1,
      "userId": "clerk-456",
      "data": { "name": "John Doe" },
      "metadata": { "source": "clerk" }
    }
  ]
}
```

### Replay Events

```http
GET /events/replay?aggregateId=user-123&eventTypes=user.created,user.updated&limit=10
```

### Get Aggregate Events

```http
GET /events/aggregate?aggregateId=user-123&aggregateType=user
```

### Get Event Statistics

```http
GET /events/stats
```

Response:
```json
{
  "totalEvents": 150,
  "uniqueAggregates": 45,
  "eventTypes": 8,
  "eventTypeBreakdown": {
    "user.created": 25,
    "user.updated": 30,
    "vendor.created": 20
  },
  "aggregateTypeBreakdown": {
    "user": 55,
    "vendor": 95
  },
  "timeRange": {
    "earliest": "2024-01-01T00:00:00Z",
    "latest": "2024-01-31T23:59:59Z"
  }
}
```

## Domain Events

### User Events

- `user.created` - New user account created
- `user.updated` - User information updated
- `user.deleted` - User account deleted
- `user.integration.created` - User integration added
- `user.integration.deleted` - User integration removed

### Vendor Events

- `vendor.created` - New vendor created
- `vendor.updated` - Vendor information updated
- `vendor.deleted` - Vendor deleted

### Location Events

- `vendor.location.updated` - Vendor location updated
- `user.location.updated` - User location updated

### WebSocket Events

- `websocket.user.connected` - User connected to WebSocket
- `websocket.user.disconnected` - User disconnected from WebSocket
- `websocket.vendor.connected` - Vendor connected to WebSocket
- `websocket.vendor.disconnected` - Vendor disconnected from WebSocket

## Benefits Achieved

### 1. Complete Audit Trail

Every action in the system is now tracked with:
- Who performed the action
- When it happened
- What changed
- Why it changed (metadata)

### 2. Event Replay Capability

- Rebuild any aggregate state from events
- Debug issues by replaying events
- Create point-in-time snapshots

### 3. Temporal Queries

- Query data as it existed at any point in time
- Track changes over time
- Analyze user behavior patterns

### 4. Compliance & Debugging

- Meet regulatory requirements
- Debug production issues
- Understand system behavior

### 5. Scalability

- Events can be processed asynchronously
- Easy to add new event consumers
- Horizontal scaling of event processing

## Production Considerations

### 1. Event Storage

For production, consider:
- **NATS JetStream**: Persistent event storage with replay
- **Event Store**: Dedicated event sourcing database
- **Time-series Database**: For high-volume event storage

### 2. Performance

- Index events by aggregate ID and timestamp
- Implement event snapshots for large aggregates
- Use event sourcing only for important domain events

### 3. Monitoring

- Monitor event volume and storage usage
- Track event processing latency
- Alert on event processing failures

### 4. Data Retention

- Configure appropriate retention policies
- Archive old events to cold storage
- Implement data deletion for GDPR compliance

## Testing

The event sourcing system includes comprehensive tests:

```bash
# Run event sourcing tests
nx test events --testNamePattern="Event Sourcing"
```

Tests cover:
- Event publishing with aggregates
- Version management
- Event replay functionality
- State reconstruction
- Event retention policies

## Migration Guide

### For Existing Services

1. **Update Event Publishing**:
   ```typescript
   // Before
   await this.eventsService.publishEvent('user.created', userData);
   
   // After
   await this.eventsService.publishEvent('user.created', userData, {
     aggregateId: user.id,
     aggregateType: 'user',
     userId: clerkId,
     metadata: { source: 'clerk' }
   });
   ```

2. **Add Event Sourcing to New Services**:
   - Identify domain aggregates
   - Define event types
   - Add aggregate information to events
   - Create reducer functions for state reconstruction

### For New Services

1. **Follow the Template**:
   ```typescript
   @Injectable()
   export class NewService {
     constructor(
       @Inject('EventsService') private eventsService: IEventsService
     ) {}
   
     async createEntity(data: any) {
       const entity = await this.repository.create(data);
       
       await this.eventsService.publishEvent('entity.created', entity, {
         aggregateId: entity.id,
         aggregateType: 'entity',
         userId: data.userId,
         metadata: { source: 'api' }
       });
       
       return entity;
     }
   }
   ```

## Future Enhancements

### 1. Event Snapshots

Implement periodic snapshots to improve state reconstruction performance:

```typescript
interface EventSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: any;
  timestamp: string;
}
```

### 2. Event Projections

Create read models from events for efficient querying:

```typescript
interface EventProjection {
  name: string;
  eventTypes: string[];
  handler: (event: EventMessage) => Promise<void>;
}
```

### 3. Event Sourcing with CQRS

Separate command and query responsibilities:

```typescript
// Command side (writes)
class CreateUserCommand {
  constructor(public readonly name: string, public readonly email: string) {}
}

// Query side (reads)
class UserQueryService {
  async getUserById(id: string): Promise<User> {
    // Query read model
  }
}
```

## Conclusion

The event sourcing implementation provides a solid foundation for:
- Complete audit trails
- Event replay and debugging
- Temporal data analysis
- Compliance requirements
- Scalable event processing

This system enhances the existing microservices architecture while maintaining backward compatibility and providing clear migration paths for existing services. 