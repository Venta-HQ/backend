# Events Library

This library provides event-driven communication and messaging utilities for the Venta backend services.

## Overview

The events library enables asynchronous communication between services using NATS messaging. It provides a clean interface for publishing and subscribing to events, supporting event-driven architecture patterns.

## Features

- **Event Publishing**: Publish events to message queues
- **Event Subscription**: Subscribe to and handle events
- **NATS Integration**: Message broker integration for reliable messaging
- **Event Types**: Type-safe event definitions and handling
- **Asynchronous Communication**: Non-blocking service communication

## Usage

### Publishing Events

Publish events to notify other services about important actions or state changes.

```typescript
import { IEventsService } from '@app/events';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
	constructor(private readonly eventsService: IEventsService) {}

	async createUser(userData: CreateUserInput) {
		const user = await this.prisma.user.create({ data: userData });

		// Publish user created event
		await this.eventsService.publish('user.created', {
			userId: user.id,
			email: user.email,
			timestamp: new Date(),
		});

		return user;
	}
}
```

### Subscribing to Events

Subscribe to events to react to changes or actions from other services.

```typescript
import { IEventsService } from '@app/events';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class NotificationService implements OnModuleInit {
	constructor(private readonly eventsService: IEventsService) {}

	async onModuleInit() {
		// Subscribe to user events
		await this.eventsService.subscribe('user.created', async (data) => {
			await this.sendWelcomeEmail(data.email);
		});

		await this.eventsService.subscribe('user.updated', async (data) => {
			await this.updateUserProfile(data.userId);
		});
	}

	private async sendWelcomeEmail(email: string) {
		// Send welcome email logic
	}
}
```

### Event Types

Define and use typed events to ensure consistency and type safety.

```typescript
import { IEventsService } from '@app/events';

interface UserCreatedEvent {
	userId: string;
	email: string;
	timestamp: Date;
}

interface UserUpdatedEvent {
	userId: string;
	changes: Record<string, any>;
	timestamp: Date;
}

// Publish typed events
await this.eventsService.publish<UserCreatedEvent>('user.created', {
	userId: '123',
	email: 'user@example.com',
	timestamp: new Date(),
});
```

## Dependencies

- NATS for message brokering
- NestJS for framework integration
