# WebSocket Best Practices & Patterns

## Overview

This document outlines the best practices, patterns, and architectural decisions for WebSocket functionality in the Venta backend system. Following these guidelines ensures consistency, security, and maintainability across all WebSocket implementations.

## 🏗️ **Architecture Patterns**

### 1. **Gateway Pattern**
- Each WebSocket gateway should handle a specific domain or namespace
- Use namespaces to separate different types of connections (e.g., `/user`, `/vendor`)
- Keep gateways focused and single-responsibility

```typescript
@WebSocketGateway({ namespace: '/user' })
export class UserLocationGateway {
  // Handle user-specific location updates
}

@WebSocketGateway({ namespace: '/vendor' })
export class VendorLocationGateway {
  // Handle vendor-specific location updates
}
```

### 2. **Service Layer Pattern**
- Separate business logic from WebSocket handling
- Use dedicated services for connection management, data processing, etc.
- Keep gateways thin and focused on WebSocket communication

```typescript
@Injectable()
export class UserConnectionManagerService {
  // Handle user connection state and management
}

@WebSocketGateway()
export class UserGateway {
  constructor(
    private readonly connectionManager: UserConnectionManagerService,
    private readonly locationService: LocationService,
  ) {}
}
```

### 3. **Event-Driven Architecture**
- Use the events system for cross-service communication
- Emit events for important state changes
- Subscribe to events from other services

```typescript
// Emit events for important state changes
await this.eventsService.publishEvent('websocket.user.connected', {
  userId,
  socketId,
  timestamp: new Date().toISOString(),
});

// Subscribe to events from other services
this.eventsService.subscribeToEvent('user.location.updated', (data) => {
  this.broadcastToUser(data.userId, 'location_updated', data);
});
```

## 🔐 **Security Patterns**

### 1. **Authentication**
- Always use the `WsAuthGuard` for protected WebSocket connections
- Validate JWT tokens on connection establishment
- Attach user information to socket objects for easy access

```typescript
@WebSocketGateway({ namespace: '/user' })
@UseGuards(WsAuthGuard)
export class UserGateway {
  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(client: AuthenticatedSocket, data: LocationData) {
    // client.userId is automatically available from authentication
    return this.locationService.updateLocation(client.userId, data);
  }
}
```

### 2. **Rate Limiting**
- Implement rate limiting for WebSocket messages
- Use the `WsRateLimitGuard` to prevent abuse
- Configure different limits for different types of operations

```typescript
@SubscribeMessage('updateLocation')
@UseGuards(new WsRateLimitGuard(redis, {
  limit: 10,
  windowMs: 60000, // 1 minute
}))
async handleLocationUpdate(client: Socket, data: LocationData) {
  // Handle location update
}
```

### 3. **Input Validation**
- Always validate incoming WebSocket messages
- Use the `SchemaValidatorPipe` with Zod schemas
- Define clear validation rules for all message types

```typescript
@SubscribeMessage('updateLocation')
async handleLocationUpdate(
  @MessageBody(new SchemaValidatorPipe(LocationUpdateSchema)) data: LocationData,
  @ConnectedSocket() client: Socket,
) {
  // Data is automatically validated
  return this.locationService.updateLocation(data);
}
```

## 📊 **Monitoring & Observability**

### 1. **Connection Health Monitoring**
- Use the `ConnectionHealthService` to track connection metrics
- Monitor active connections, disconnections, and errors
- Set up alerts for unusual connection patterns

```typescript
// Record connection events
await this.connectionHealth.recordConnection(socketId, userId);

// Record disconnection events
await this.connectionHealth.recordDisconnection(socketId);

// Record errors
await this.connectionHealth.recordError(socketId, error.message);
```

### 2. **Structured Logging**
- Use structured logging for all WebSocket events
- Include relevant context (userId, socketId, event type)
- Log at appropriate levels (debug, info, warn, error)

```typescript
this.logger.log(`User ${userId} connected with socket ${socketId}`, {
  userId,
  socketId,
  event: 'connection',
  timestamp: new Date().toISOString(),
});
```

### 3. **Metrics Collection**
- Track key metrics: connection count, message rate, error rate
- Use Redis for real-time metrics storage
- Export metrics for monitoring dashboards

## 🔄 **Error Handling Patterns**

### 1. **Centralized Error Handling**
- Use the `WsErrorFilter` for consistent error responses
- Define specific error codes for different scenarios
- Provide meaningful error messages to clients

```typescript
// Use specific error codes
throw new WsError(ErrorCodes.WS_AUTHENTICATION_FAILED);

// Provide context for errors
throw new WsError(ErrorCodes.VALIDATION_ERROR, {
  field: 'location',
  message: 'Invalid coordinates provided',
});
```

### 2. **Graceful Degradation**
- Handle service failures gracefully
- Provide fallback responses when external services are unavailable
- Implement retry logic for transient failures

```typescript
try {
  const result = await this.externalService.call();
  return result;
} catch (error) {
  this.logger.error('External service call failed:', error);
  // Provide fallback response
  return { status: 'degraded', message: 'Service temporarily unavailable' };
}
```

### 3. **Connection Recovery**
- Implement automatic reconnection logic on the client side
- Handle connection timeouts gracefully
- Provide clear feedback about connection status

## 🚀 **Performance Patterns**

### 1. **Connection Pooling**
- Use Redis for connection state management
- Implement efficient connection lookup and cleanup
- Avoid memory leaks by properly cleaning up disconnected sockets

### 2. **Message Batching**
- Batch multiple updates when possible
- Use debouncing for frequent updates (e.g., location updates)
- Implement message queuing for high-volume scenarios

```typescript
// Debounce location updates
const debouncedUpdate = debounce(async (userId: string, location: Location) => {
  await this.locationService.updateLocation(userId, location);
}, 1000); // 1 second debounce
```

### 3. **Room Management**
- Use Socket.IO rooms for efficient broadcasting
- Implement smart room joining/leaving based on location
- Clean up empty rooms to conserve resources

```typescript
// Join location-based rooms
await socket.join(`location:${locationId}`);

// Leave old rooms when location changes
await socket.leave(`location:${oldLocationId}`);
await socket.join(`location:${newLocationId}`);
```

## 📝 **Code Organization**

### 1. **File Structure**
```
websocket-gateway/
├── src/
│   ├── gateways/           # WebSocket gateways
│   │   ├── user-location.gateway.ts
│   │   └── vendor-location.gateway.ts
│   ├── services/           # Business logic services
│   │   ├── user-connection-manager.service.ts
│   │   ├── vendor-connection-manager.service.ts
│   │   └── connection-health.service.ts
│   ├── guards/             # WebSocket guards
│   │   ├── ws-auth.guard.ts
│   │   └── ws-rate-limit.guard.ts
│   ├── interfaces/         # Type definitions
│   │   └── websocket.types.ts
│   └── websocket-gateway.module.ts
```

### 2. **Naming Conventions**
- Gateways: `{Domain}Gateway` (e.g., `UserLocationGateway`)
- Services: `{Domain}Service` (e.g., `UserConnectionManagerService`)
- Guards: `Ws{Type}Guard` (e.g., `WsAuthGuard`)
- Interfaces: `{Type}Interface` (e.g., `AuthenticatedSocket`)

### 3. **Type Safety**
- Define interfaces for all WebSocket message types
- Use TypeScript strictly for better type safety
- Extend Socket interface for authenticated connections

```typescript
interface AuthenticatedSocket extends Socket {
  userId?: string;
  clerkId?: string;
}

interface LocationUpdateMessage {
  lat: number;
  long: number;
  timestamp: string;
}
```

## 🧪 **Testing Patterns**

### 1. **Unit Testing**
- Test services independently from WebSocket logic
- Mock external dependencies (Redis, gRPC services)
- Test error scenarios and edge cases

### 2. **Integration Testing**
- Test WebSocket connections end-to-end
- Verify authentication and authorization
- Test message validation and error handling

### 3. **Load Testing**
- Test connection limits and performance
- Verify rate limiting works correctly
- Test under high message volume

## 🔧 **Configuration Management**

### 1. **Environment Variables**
- Use environment variables for all configuration
- Define clear defaults for development
- Document all required configuration options

```typescript
// Configuration schema
export const WebSocketConfigSchema = z.object({
  WEBSOCKET_GATEWAY_SERVICE_PORT: z.number().default(5004),
  WEBSOCKET_RATE_LIMIT: z.number().default(100),
  WEBSOCKET_RATE_LIMIT_WINDOW: z.number().default(60000),
});
```

### 2. **Feature Flags**
- Use feature flags for experimental features
- Allow runtime configuration changes
- Implement graceful feature rollouts

## 📚 **Documentation Standards**

### 1. **Code Documentation**
- Document all public methods and interfaces
- Include usage examples in comments
- Document error scenarios and handling

### 2. **API Documentation**
- Document all WebSocket events and message formats
- Provide client-side connection examples
- Include error response formats

### 3. **Architecture Documentation**
- Document system architecture and design decisions
- Include sequence diagrams for complex flows
- Maintain up-to-date dependency documentation

## 🚨 **Common Anti-Patterns to Avoid**

### 1. **Don't Store Business Logic in Gateways**
```typescript
// ❌ Bad: Business logic in gateway
@WebSocketGateway()
export class BadGateway {
  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(client: Socket, data: any) {
    // Complex business logic here
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    const location = await this.locationService.calculateOptimalLocation(data);
    // ... more business logic
  }
}

// ✅ Good: Delegate to service
@WebSocketGateway()
export class GoodGateway {
  constructor(private readonly locationService: LocationService) {}
  
  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(client: Socket, data: any) {
    return this.locationService.updateLocation(data);
  }
}
```

### 2. **Don't Ignore Error Handling**
```typescript
// ❌ Bad: No error handling
@SubscribeMessage('updateLocation')
async handleLocationUpdate(client: Socket, data: any) {
  const result = await this.service.update(data);
  client.emit('success', result);
}

// ✅ Good: Proper error handling
@SubscribeMessage('updateLocation')
async handleLocationUpdate(client: Socket, data: any) {
  try {
    const result = await this.service.update(data);
    client.emit('success', result);
  } catch (error) {
    this.logger.error('Location update failed:', error);
    client.emit('error', { message: 'Failed to update location' });
  }
}
```

### 3. **Don't Use Global Variables**
```typescript
// ❌ Bad: Global state
let connectedUsers = new Map();

// ✅ Good: Service-managed state
@Injectable()
export class ConnectionManagerService {
  private connectedUsers = new Map();
  
  addUser(userId: string, socketId: string) {
    this.connectedUsers.set(userId, socketId);
  }
}
```

## 🔄 **Migration Guidelines**

When updating existing WebSocket implementations:

1. **Add Authentication First**: Implement `WsAuthGuard` before adding new features
2. **Add Rate Limiting**: Implement rate limiting for all public endpoints
3. **Update Error Handling**: Migrate to centralized error handling
4. **Add Monitoring**: Implement connection health monitoring
5. **Update Documentation**: Keep documentation current with changes

## 📞 **Support & Maintenance**

- Monitor connection metrics regularly
- Set up alerts for unusual patterns
- Keep dependencies updated
- Review and update security measures
- Maintain comprehensive test coverage 