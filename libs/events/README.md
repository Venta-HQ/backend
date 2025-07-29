# Events Library

This library provides a NATS-based event system for microservices communication with support for stream-based event listening.

## Features

- **Event Publishing**: Publish events to NATS with automatic message formatting
- **Event Subscription**: Subscribe to specific event types or all events
- **Stream-based Listening**: Create dedicated streams for specific event types with load balancing
- **Queue Groups**: Support for load balancing across multiple instances
- **Health Monitoring**: Built-in health checks for NATS connection
- **Error Handling**: Automatic retry and failed event storage

## Quick Start

### Installation

The library is already included in the workspace. Import it in your module:

```typescript
import { EventsModule } from '@app/events';

@Module({
	imports: [EventsModule],
	// ...
})
export class MyModule {}
```

### Basic Usage

```typescript
import { IEventsService } from '@app/events';

@Injectable()
export class MyService {
	constructor(@Inject('EventsService') private eventsService: IEventsService) {}

	async createUser(userData: any) {
		const user = await this.userRepository.create(userData);
		await this.eventsService.publishEvent('user.created', user);
		return user;
	}
}
```

### Stream-based Event Listening

```typescript
@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
	private userEventStream: any;

	constructor(@Inject('EventsService') private eventsService: IEventsService) {}

	async onModuleInit() {
		this.userEventStream = await this.eventsService.subscribeToStream(
			{
				streamName: 'analytics-user-events',
				eventTypes: ['user.created', 'user.updated', 'user.deleted'],
				groupName: 'analytics',
			},
			async (event) => {
				// Handle event
				await this.processEvent(event);
			},
		);
	}

	async onModuleDestroy() {
		if (this.userEventStream) {
			await this.eventsService.unsubscribeFromStream(this.userEventStream);
		}
	}
}
```

## Configuration

Set the `NATS_URL` environment variable:

```bash
NATS_URL=nats://localhost:4222
```

## API Reference

### IEventsService

- `publishEvent<T>(eventType: string, data: T): Promise<void>`
- `subscribeToEventType(eventType: string, callback: (event: EventMessage) => void): Promise<Subscription>`
- `subscribeToEvents(callback: (event: EventMessage) => void): Promise<void>`
- `subscribeToStream(options: StreamSubscriptionOptions, callback: (event: EventMessage) => void): Promise<EventStream>`
- `unsubscribeFromStream(stream: EventStream): Promise<void>`
- `getActiveStreams(): EventStream[]`
- `healthCheck(): Promise<{ connected: boolean; status: string }>`

For detailed documentation and examples, see the main project documentation.
