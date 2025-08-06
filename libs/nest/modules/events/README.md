# Events Module

## Purpose

The Events Module provides standardized event publishing and subscription capabilities across all services in the Venta backend system. It enables asynchronous communication between microservices through NATS messaging, allowing services to publish events and subscribe to events from other services. This module ensures reliable event delivery, proper event typing, and consistent event patterns throughout the system.

## Overview

This module provides:

- Event publishing with type-safe event definitions
- Event subscription and handling across services
- NATS integration for reliable message delivery
- Event correlation and tracing capabilities
- Event validation and schema enforcement
- Error handling and retry mechanisms for failed events
- Event monitoring and metrics collection

## Usage

### Module Registration

Register the EventsModule in your service:

```typescript
@Module({
	imports: [
		BootstrapModule.forRoot({
			appName: 'Your Service',
			protocol: 'grpc',
			additionalModules: [EventsModule.register({ appName: 'Your Service' })],
		}),
	],
})
export class YourModule {}
```

### Service Injection

Inject EventService into your services for event publishing:

```typescript
@Injectable()
export class YourService {
	constructor(private eventService: EventService) {}

	async createUser(userData: CreateUserData) {
		const user = await this.userRepository.create(userData);

		// Publish user created event
		await this.eventService.emit('user.created', {
			userId: user.id,
			email: user.email,
			timestamp: new Date(),
		});

		return user;
	}

	async updateUser(userId: string, updates: UpdateUserData) {
		const user = await this.userRepository.update(userId, updates);

		// Publish user updated event
		await this.eventService.emit('user.updated', {
			userId: user.id,
			changes: updates,
			timestamp: new Date(),
		});

		return user;
	}
}
```

### Event Publishing

Publish events with structured data:

```typescript
// Simple event
await this.eventService.emit('user.login', {
	userId: 'user-123',
	timestamp: new Date(),
});

// Complex event with metadata
await this.eventService.emit('vendor.created', {
	vendorId: 'vendor-456',
	name: 'Acme Corp',
	category: 'technology',
	ownerId: 'user-123',
	metadata: {
		source: 'api',
		version: '1.0',
	},
	timestamp: new Date(),
});

// Error event
await this.eventService.emit('payment.failed', {
	userId: 'user-123',
	paymentId: 'payment-789',
	error: 'Insufficient funds',
	amount: 99.99,
	timestamp: new Date(),
});
```

### Event Subscription

Subscribe to events from other services:

```typescript
@Injectable()
export class NotificationService {
	constructor(private eventService: EventService) {}

	async onModuleInit() {
		// Subscribe to user events
		await this.eventService.subscribe('user.created', this.handleUserCreated.bind(this));
		await this.eventService.subscribe('user.updated', this.handleUserUpdated.bind(this));

		// Subscribe to vendor events
		await this.eventService.subscribe('vendor.created', this.handleVendorCreated.bind(this));
	}

	private async handleUserCreated(event: UserCreatedEvent) {
		// Send welcome email
		await this.emailService.sendWelcomeEmail(event.userId, event.email);
	}

	private async handleVendorCreated(event: VendorCreatedEvent) {
		// Send vendor approval notification
		await this.notificationService.sendVendorApproval(event.vendorId, event.ownerId);
	}
}
```

### Event Patterns

Follow consistent event naming and data patterns:

```typescript
// Event naming convention: resource.action
// Examples:
// - user.created
// - user.updated
// - user.deleted
// - vendor.created
// - vendor.status.changed
// - payment.completed
// - payment.failed

// Event data structure
interface EventData {
	// Resource identifier
	resourceId: string;

	// Event metadata
	timestamp: Date;

	// Event-specific data
	[key: string]: any;
}
```

### Environment Configuration

Configure NATS connection for event publishing:

```env
# NATS Configuration
NATS_URL=nats://localhost:4222
NATS_CLUSTER_ID=venta-cluster
NATS_CLIENT_ID=your-service

# Event Configuration
EVENT_RETRY_ATTEMPTS=3
EVENT_RETRY_DELAY=1000
```

## Key Benefits

- **Decoupled Communication**: Asynchronous communication between services
- **Type Safety**: TypeScript interfaces for event definitions
- **Reliable Delivery**: NATS-based reliable message delivery
- **Event Correlation**: Request tracing and event correlation
- **Scalability**: Horizontal scaling through event-driven architecture
- **Monitoring**: Event metrics and performance monitoring
- **Error Handling**: Automatic retry and error recovery mechanisms

## Dependencies

- **NATS** for message broker and event delivery
- **NestJS Microservices** for NATS integration
- **TypeScript** for type-safe event definitions
