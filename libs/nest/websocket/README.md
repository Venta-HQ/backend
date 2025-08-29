# WebSocket Module

## Purpose

This module provides base classes and utilities for building consistent WebSocket gateways across the Venta backend system. It standardizes common patterns like connection validation, error handling, and logging to ensure all WebSocket implementations follow the same conventions.

## Module Structure

The WebSocketModule provides:

- **BaseWebSocketGateway**: Abstract base class for all WebSocket gateways
- **PresenceService**: Service for managing WebSocket presence and socket-to-entity mapping
- **Proper dependency injection**: All services are properly provided and exported

## Components

### BaseWebSocketGateway

A base class that all WebSocket gateways should extend for consistency and reduced code duplication.

#### Features

- **Standardized Connection Validation**: Common pattern for validating authenticated users
- **Consistent Error Handling**: Graceful disconnection instead of throwing exceptions
- **Unified Logging**: Structured logging patterns for connections and disconnections
- **Entity ID Extraction**: Standard way to get user/vendor IDs from authenticated sockets

#### Usage

```typescript
import { BaseWebSocketGateway } from '@venta/nest/modules';

@WebSocketGateway({
	namespace: 'user',
	cors: {
		origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
		credentials: true,
	},
})
@UseGuards(WsAuthGuard)
export class UserLocationGateway extends BaseWebSocketGateway implements OnGatewayConnection {
	constructor(
		private readonly userConnectionManager: UserConnectionManagerService,
		protected readonly logger: Logger,
	) {
		super();
		this.logger.setContext(UserLocationGateway.name);
	}

	protected readonly connectionManager = this.userConnectionManager;

	async handleConnection(client: AuthenticatedSocket) {
		try {
			const userId = this.validateConnection(client, 'User');
			if (!userId) return;

			await this.userConnectionManager.registerUser(client.id, userId);
			this.logConnectionSuccess(client, userId, 'User');
		} catch (error) {
			this.handleConnectionError(error, client, 'handle user connection');
		}
	}
}
```

#### Methods

- **`validateConnection(client, entityType)`**: Validates connection and returns entity ID or null
- **`handleConnectionError(error, client, operation)`**: Standardized error handling
- **`logConnectionSuccess(client, entityId, entityType)`**: Success logging
- **`logDisconnectionSuccess(client, entityType)`**: Disconnection logging
- **`getEntityId(client)`**: Extract entity ID from authenticated socket

## Usage

### Import the Module

```typescript
import { WebSocketModule } from '@venta/nest/modules';

@Module({
	imports: [WebSocketModule],
	// ... other configuration
})
export class YourModule {}
```

### Extend BaseWebSocketGateway

```typescript
import { BaseWebSocketGateway, PresenceService } from '@venta/nest/modules';

@WebSocketGateway()
export class YourGateway extends BaseWebSocketGateway {
	constructor(
		protected readonly logger: Logger,
		protected readonly presence: PresenceService,
	) {
		super();
	}
}
```

## Benefits

- **Consistency**: All WebSocket gateways follow the same patterns
- **Reduced Duplication**: Common functionality is centralized
- **Better Error Handling**: Graceful disconnection prevents crashes
- **Standardized Logging**: Consistent log structure across all gateways
- **Type Safety**: TypeScript support with proper interfaces
- **Proper Module Structure**: Follows NestJS best practices
