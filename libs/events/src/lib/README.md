# EventsModule

A NestJS module that provides event-driven communication using NATS messaging with automatic retry and failure handling.

## Features

- **NATS Integration**: High-performance messaging using NATS
- **Event Publishing**: Publish events with automatic message ID generation
- **Event Subscription**: Subscribe to specific event types or all events
- **Failure Handling**: Automatic storage and retry of failed events
- **Health Monitoring**: Connection health checks and status reporting
- **Subject-Based Routing**: Efficient event filtering using NATS subjects

## Usage

```typescript
// In your service
import { EventsModule, IEventsService } from '@app/nest/modules';

@Module({
	imports: [EventsModule],
})
export class AppModule {}

@Injectable()
export class UserService {
	constructor(@Inject('EventsService') private readonly eventsService: IEventsService) {}

	async createUser(userData: any) {
		// Create user logic...

		// Publish event
		await this.eventsService.publishEvent('user.created', {
			userId: user.id,
			email: user.email,
		});
	}

	async handleUserEvents() {
		// Subscribe to specific event type
		await this.eventsService.subscribeToEventType('user.created', (event) => {
			console.log('User created:', event.data);
		});

		// Or subscribe to all events
		await this.eventsService.subscribeToEvents((event) => {
			console.log('Event received:', event.type, event.data);
		});
	}
}
```

## Configuration

### Environment Variables

- `NATS_URL` - NATS server URL (default: `nats://localhost:4222`)

### Example Environment Setup

```env
NATS_URL="nats://localhost:4222"
```

## API

### IEventsService Interface

```typescript
interface IEventsService {
	// Publish an event
	publishEvent<T>(eventType: string, data: T): Promise<void>;

	// Subscribe to a specific event type
	subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<Subscription>;

	// Subscribe to all events
	subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>;

	// Check service health
	healthCheck(): Promise<{ connected: boolean; status: string }>;
}
```

### EventMessage Structure

```typescript
interface EventMessage {
	data: any; // Event payload
	messageId?: string; // Unique message identifier
	timestamp: string; // ISO timestamp
	type: string; // Event type
}
```

## Event Patterns

### Publishing Events

```typescript
// Simple event
await this.eventsService.publishEvent('user.created', { userId: '123' });

// Complex event
await this.eventsService.publishEvent('order.completed', {
	orderId: '456',
	userId: '123',
	total: 99.99,
	items: ['item1', 'item2'],
});
```

### Subscribing to Events

```typescript
// Subscribe to specific event type
await this.eventsService.subscribeToEventType('user.created', (event) => {
	// Handle user.created events only
	console.log('New user:', event.data);
});

// Subscribe to all events
await this.eventsService.subscribeToEvents((event) => {
	// Handle all events
	switch (event.type) {
		case 'user.created':
			// Handle user creation
			break;
		case 'order.completed':
			// Handle order completion
			break;
	}
});
```

## Subject-Based Routing

Events are published to NATS subjects following the pattern:

- `events.{eventType}`

Examples:

- `events.user.created`
- `events.order.completed`
- `events.payment.processed`

## Failure Handling

The service automatically handles:

- **Failed Publications**: Stores failed events for retry
- **Connection Issues**: Automatic reconnection
- **Message Processing Errors**: Logs errors without breaking the subscription

### Failed Event Storage

Failed events are stored with retry logic:

- Maximum 3 retry attempts
- Exponential backoff
- Persistent storage for recovery

## Health Monitoring

```typescript
// Check service health
const health = await this.eventsService.healthCheck();
console.log(health); // { connected: true, status: 'healthy' }
```

## Testing

See the test files for comprehensive coverage:

- `events.module.test.ts` - Module configuration tests
- `nats-events.service.test.ts` - Service functionality tests

## Dependencies

- `nats` - NATS messaging client
- `@nestjs/config` - Configuration management
