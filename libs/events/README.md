# Events Library

This library provides a NATS-based event system for microservices communication with support for stream-based event listening.

## Features

- **Event Publishing**: Publish events to NATS with automatic message formatting
- **Event Subscription**: Subscribe to specific event types or all events
- **Stream-based Listening**: Create dedicated streams for specific event types with load balancing
- **Queue Groups**: Support for load balancing across multiple instances
- **Health Monitoring**: Built-in health checks for NATS connection
- **Error Handling**: Automatic retry and failed event storage (basic implementation)

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

### Real-world Examples

Here's how the events library is used in the actual codebase:

```typescript
// Vendor service - publishing events
import { IEventsService } from '@app/events';

@Injectable()
export class VendorService {
	constructor(@Inject('EventsService') private readonly eventsService: IEventsService) {}

	async createVendor(data: VendorCreateData) {
		const vendor = await this.prisma.vendor.create({ data });

		// Publish vendor created event
		await this.eventsService.publishEvent('vendor.created', vendor);

		return vendor;
	}

	async updateVendor(id: string, data: VendorUpdateData) {
		const vendor = await this.prisma.vendor.update({
			where: { id },
			data,
		});

		// Publish vendor updated event
		await this.eventsService.publishEvent('vendor.updated', vendor);

		return vendor;
	}

	async deleteVendor(id: string) {
		const vendor = await this.prisma.vendor.delete({ where: { id } });

		// Publish vendor deleted event
		await this.eventsService.publishEvent('vendor.deleted', vendor);

		return vendor;
	}
}
```

```typescript
// Algolia sync service - consuming events
import { IEventsService } from '@app/events';

@Injectable()
export class AlgoliaSyncService implements OnModuleInit, OnModuleDestroy {
	private vendorEventStream: any;

	constructor(@Inject('EventsService') private readonly eventsService: IEventsService) {}

	async onModuleInit() {
		this.vendorEventStream = await this.eventsService.subscribeToStream(
			{
				streamName: 'algolia-sync-vendor-events',
				eventTypes: ['vendor.created', 'vendor.updated', 'vendor.deleted', 'vendor.location.updated'],
				groupName: 'algolia-sync',
			},
			async (event) => {
				// Handle vendor events for Algolia sync
				await this.handleVendorEvent(event);
			},
		);
	}

	async onModuleDestroy() {
		if (this.vendorEventStream) {
			await this.eventsService.unsubscribeFromStream(this.vendorEventStream);
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

### EventMessage Interface

```typescript
interface EventMessage {
	type: string;
	data: any;
	messageId: string;
	timestamp: string;
}
```

### StreamSubscriptionOptions Interface

```typescript
interface StreamSubscriptionOptions {
	streamName?: string;
	eventTypes?: string[];
	groupName?: string;
}
```

## Limitations

- **Failed Event Storage**: Basic implementation - failed events are logged but not persistently stored
- **Event Replay**: No built-in event replay functionality
- **Event Ordering**: No guaranteed event ordering across different event types
- **Dead Letter Queue**: No dead letter queue for failed event processing

## Dependencies

- NATS for message broker
- NestJS for framework integration
