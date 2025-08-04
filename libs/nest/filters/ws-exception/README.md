# WebSocket Exception Filter

## Purpose

The WebSocket Exception Filter provides centralized error handling for WebSocket connections in the Venta backend system. It catches exceptions, transforms them into appropriate WebSocket error responses, and ensures consistent error formatting across all WebSocket gateways.

## What It Contains

- **WsExceptionFilter**: Main exception filter for WebSocket connections
- **Error Transformation**: Converts exceptions to WebSocket error messages
- **Response Formatting**: Consistent WebSocket error response structure

## Usage

This filter is used to handle exceptions in WebSocket gateways and provide consistent error responses.

### Basic Usage
```typescript
// Import the WebSocket exception filter
import { WsExceptionFilter } from '@app/nest/filters/ws-exception';

@WebSocketGateway()
export class LocationGateway {
  @UseFilters(WsExceptionFilter)
  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(client: Socket, data: LocationData) {
    return this.locationService.updateLocation(data);
  }
}
```

### Global Application
```typescript
// Apply WebSocket exception filter globally
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { WsExceptionFilter } from '@app/nest/filters/ws-exception';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: WsExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### Gateway-Level Application
```typescript
// Apply to specific WebSocket gateway
import { WsExceptionFilter } from '@app/nest/filters/ws-exception';

@WebSocketGateway()
@UseFilters(WsExceptionFilter)
export class UserLocationGateway {
  @SubscribeMessage('updateUserLocation')
  async handleUserLocationUpdate(client: Socket, data: UserLocationData) {
    return this.locationService.updateUserLocation(data);
  }

  @SubscribeMessage('getNearbyVendors')
  async handleGetNearbyVendors(client: Socket, data: LocationQuery) {
    return this.vendorService.getNearbyVendors(data);
  }
}
```

### Method-Level Application
```typescript
// Apply to specific WebSocket methods
import { WsExceptionFilter } from '@app/nest/filters/ws-exception';

@WebSocketGateway()
export class NotificationGateway {
  @UseFilters(WsExceptionFilter)
  @SubscribeMessage('subscribeToNotifications')
  async handleSubscribe(client: Socket, data: SubscriptionData) {
    return this.notificationService.subscribe(client.id, data);
  }

  @UseFilters(WsExceptionFilter)
  @SubscribeMessage('unsubscribeFromNotifications')
  async handleUnsubscribe(client: Socket, data: SubscriptionData) {
    return this.notificationService.unsubscribe(client.id, data);
  }
}
```

### Custom Error Handling
```typescript
// Custom error handling with WebSocket exception filter
import { WsExceptionFilter } from '@app/nest/filters/ws-exception';
import { AppError, ErrorCodes } from '@app/nest/errors';

@WebSocketGateway()
@UseFilters(WsExceptionFilter)
export class ChatGateway {
  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, data: ChatMessage) {
    const user = await this.authService.getUserFromSocket(client);
    
    if (!user) {
      throw new AppError('User not authenticated', ErrorCodes.UNAUTHORIZED);
    }
    
    return this.chatService.sendMessage(user.id, data);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, data: RoomData) {
    // Validation errors will be caught and formatted by the filter
    return this.chatService.joinRoom(client.id, data);
  }
}
```

### Error Response Format
```typescript
// Example WebSocket error responses from the filter
// Authentication error
{
  "event": "error",
  "data": {
    "code": 401,
    "message": "User not authenticated",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}

// Validation error
{
  "event": "error",
  "data": {
    "code": 400,
    "message": "Invalid location data",
    "details": "Latitude and longitude are required",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}

// Server error
{
  "event": "error",
  "data": {
    "code": 500,
    "message": "Internal server error",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Custom Exception Filter
```typescript
// Extend WebSocket exception filter for custom logic
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WsExceptionFilter } from '@app/nest/filters/ws-exception';

@Catch()
export class CustomWsExceptionFilter extends WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();
    const data = ctx.getData();

    // Add custom logging
    console.log(`WebSocket Exception occurred: ${exception}`);
    console.log(`Client ID: ${client.id}`);
    console.log(`Event data: ${JSON.stringify(data)}`);

    // Call parent implementation
    super.catch(exception, host);
  }
}

// Usage
@WebSocketGateway()
@UseFilters(CustomWsExceptionFilter)
export class CustomGateway {
  @SubscribeMessage('customEvent')
  async handleCustomEvent(client: Socket, data: any) {
    return this.service.processEvent(data);
  }
}
```

### Connection Error Handling
```typescript
// Handle connection and disconnection errors
@WebSocketGateway()
@UseFilters(WsExceptionFilter)
export class ConnectionGateway {
  @SubscribeMessage('connect')
  async handleConnection(client: Socket) {
    try {
      const user = await this.authService.authenticateSocket(client);
      await this.connectionManager.addConnection(user.id, client.id);
      return { status: 'connected', userId: user.id };
    } catch (error) {
      // This will be caught by the WsExceptionFilter
      throw new AppError('Connection failed', ErrorCodes.UNAUTHORIZED);
    }
  }

  @SubscribeMessage('disconnect')
  async handleDisconnect(client: Socket) {
    try {
      await this.connectionManager.removeConnection(client.id);
      return { status: 'disconnected' };
    } catch (error) {
      // This will be caught by the WsExceptionFilter
      throw new AppError('Disconnection failed', ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }
}
```

## Key Benefits

- **Consistency**: Uniform error response format across all WebSocket connections
- **Centralization**: Single place to handle all WebSocket exceptions
- **Debugging**: Structured error information for easier troubleshooting
- **Real-time Error Handling**: Immediate error responses to connected clients

## Dependencies

- NestJS framework
- WebSocket for real-time communication
- Socket.io for WebSocket implementation
- TypeScript for type definitions 