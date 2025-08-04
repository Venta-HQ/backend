# WebSocket Authentication Guard

## Purpose

The WebSocket Authentication Guard provides user authentication and session validation for WebSocket connections in the Venta backend system. It validates JWT tokens from WebSocket handshakes and ensures proper authentication for real-time connections.

## What It Contains

- **WsAuthGuard**: Main WebSocket authentication guard with JWT validation
- **Token Extraction**: Extracts tokens from handshake auth, query params, or headers
- **Session Management**: User session validation and caching for WebSocket connections

## Usage

This guard is used to protect WebSocket gateways that require user authentication.

### Basic Usage
```typescript
// Import the WebSocket authentication guard
import { WsAuthGuard } from '@app/nest/guards/ws-auth';

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

### Protecting Specific Methods
```typescript
// Protect specific WebSocket methods
import { WsAuthGuard } from '@app/nest/guards/ws-auth';

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
```typescript
// Client-side connection with authentication
import { io } from 'socket.io-client';

// Using handshake auth
const socket = io('ws://localhost:5004/user', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Using query parameters
const socket = io('ws://localhost:5004/user?token=your-jwt-token');

// Using headers (if supported by your client)
const socket = io('ws://localhost:5004/user', {
  extraHeaders: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

### Error Handling
```typescript
// Handle authentication errors on the client
socket.on('connect_error', (error) => {
  if (error.message.includes('authentication')) {
    // Redirect to login or refresh token
    console.log('Authentication failed, please login again');
  }
});

// Handle server-side authentication errors
socket.on('error', (error) => {
  if (error.code === 'WS_AUTHENTICATION_FAILED') {
    // Handle authentication failure
    console.log('Authentication failed:', error.message);
  }
});
```

### Mixed Authentication
```typescript
// Some methods require auth, others don't
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
```typescript
// Extend the guard for custom authentication logic
import { WsAuthGuard } from '@app/nest/guards/ws-auth';

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

## Configuration

The guard automatically integrates with:
- **Clerk Service**: For JWT token verification
- **Prisma Service**: For user database lookups
- **Redis**: For user session caching
- **Error Handling**: Uses the centralized error system

## Security Considerations

- Tokens are validated on every WebSocket connection
- User sessions are cached in Redis for performance
- Failed authentication attempts are logged for monitoring
- Sensitive error details are not exposed to clients 