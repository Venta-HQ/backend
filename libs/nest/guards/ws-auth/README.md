# WebSocket Authentication Guard

## Purpose

The WebSocket Authentication Guard provides user authentication and session validation for WebSocket connections in the Venta backend system. It validates JWT tokens from WebSocket handshakes and ensures proper authentication for real-time connections using Clerk integration.

## Overview

This guard provides:

- JWT token validation for WebSocket connections
- Token extraction from handshake auth, query parameters, or headers
- User session validation and caching for WebSocket connections
- Automatic user context injection into WebSocket clients
- Integration with Clerk authentication service
- Error handling for authentication failures

## Usage

### Basic WebSocket Authentication

Protect WebSocket gateways with authentication:

```typescript
import { WsAuthGuard } from '@venta/nest/guards/ws-auth';

@WebSocketGateway({ namespace: '/user' })
@UseGuards(WsAuthGuard)
export class UserLocationGateway {
	@SubscribeMessage('updateUserLocation')
	async handleUserLocationUpdate(client: Socket, data: UserLocationData) {
		// User is automatically authenticated and available in client.userId
		const userId = client.userId;
		return this.locationService.updateUserLocation(userId, data);
	}
}
```

### Method-Level Protection

Protect specific WebSocket methods:

```typescript
@WebSocketGateway({ namespace: '/user' })
export class UserLocationGateway {
	@UseGuards(WsAuthGuard)
	@SubscribeMessage('updateUserLocation')
	async handleUserLocationUpdate(client: Socket, data: UserLocationData) {
		return this.locationService.updateUserLocation(client.userId, data);
	}

	@UseGuards(WsAuthGuard)
	@SubscribeMessage('getNearbyVendors')
	async handleGetNearbyVendors(client: Socket, data: LocationQuery) {
		return this.vendorService.getNearbyVendors(client.userId, data);
	}
}
```

### Client Connection Examples

Connect from client with authentication:

```typescript
import { io } from 'socket.io-client';

// Using handshake auth
const socket = io('ws://localhost:5004/user', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Using query parameters
const socket = io('ws://localhost:5004/user?token=your-jwt-token');

// Using headers
const socket = io('ws://localhost:5004/user', {
  extraHeaders: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

### Error Handling

Handle authentication errors on client and server:

```typescript
// Client-side error handling
socket.on('connect_error', (error) => {
	if (error.message.includes('authentication')) {
		// Redirect to login or refresh token
		console.log('Authentication failed, please login again');
	}
});

// Server-side error handling
socket.on('error', (error) => {
	if (error.code === 'WS_AUTHENTICATION_FAILED') {
		// Handle authentication failure
		console.log('Authentication failed:', error.message);
	}
});
```

### Mixed Authentication

Protect some methods while keeping others public:

```typescript
@WebSocketGateway({ namespace: '/public' })
export class PublicGateway {
	// Public method - no auth required
	@SubscribeMessage('getPublicData')
	async handleGetPublicData(client: Socket) {
		return this.publicService.getData();
	}

	// Protected method - auth required
	@UseGuards(WsAuthGuard)
	@SubscribeMessage('getPrivateData')
	async handleGetPrivateData(client: Socket) {
		return this.privateService.getData(client.userId);
	}
}
```

### Custom Authentication Logic

Extend the guard for custom authentication requirements:

```typescript
import { WsAuthGuard } from '@venta/nest/guards/ws-auth';

@Injectable()
export class CustomWsAuthGuard extends WsAuthGuard {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Call parent authentication
		const isAuthenticated = await super.canActivate(context);

		if (!isAuthenticated) {
			return false;
		}

		// Add custom logic (e.g., role checking)
		const client = context.switchToWs().getClient();
		const user = await this.userService.findById(client.userId);

		if (!user.isActive) {
			throw new WsError(ErrorCodes.INSUFFICIENT_PERMISSIONS);
		}

		return true;
	}
}
```

## Key Benefits

- **Security**: Centralized WebSocket authentication
- **Consistency**: Uniform authentication behavior across WebSocket connections
- **Performance**: Efficient token validation and session caching
- **Flexibility**: Configurable authentication logic
- **Integration**: Seamless Clerk authentication integration
- **Error Handling**: Comprehensive error handling for authentication failures

## Dependencies

- **NestJS** for WebSocket guard framework
- **Clerk** for authentication service and JWT handling
- **Redis** for session storage and caching
