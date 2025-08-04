# WebSocket Rate Limiting Guard

## Purpose

The WebSocket Rate Limiting Guard provides rate limiting capabilities for WebSocket connections in the Venta backend system. It prevents abuse of WebSocket endpoints by limiting the number of requests per user within a specified time window.

## What It Contains

- **WsRateLimitGuard**: Main WebSocket rate limiting guard with Redis-based storage
- **Configurable Limits**: Customizable rate limits per user and event type
- **Redis Integration**: Uses Redis for distributed rate limiting across multiple instances
- **Graceful Degradation**: Allows requests when rate limiting fails

## Usage

This guard is used to protect WebSocket endpoints from abuse and ensure fair usage.

### Basic Usage
```typescript
// Import the WebSocket rate limiting guards
import { WsRateLimitGuards } from '@app/nest/guards';

@WebSocketGateway({ namespace: '/user' })
export class UserLocationGateway {
  @SubscribeMessage('updateUserLocation')
  @UseGuards(WsRateLimitGuards.standard) // 15 requests per minute
  async handleUserLocationUpdate(client: Socket, data: UserLocationData) {
    return this.locationService.updateUserLocation(data);
  }
}
```

### Different Limits for Different Operations
```typescript
@WebSocketGateway({ namespace: '/user' })
export class UserGateway {
  // Strict rate limiting for critical operations
  @SubscribeMessage('updateProfile')
  @UseGuards(WsRateLimitGuards.strict) // 5 requests per minute
  async handleProfileUpdate(client: Socket, data: ProfileData) {
    return this.userService.updateProfile(data);
  }

  // Standard rate limiting for location updates
  @SubscribeMessage('updateLocation')
  @UseGuards(WsRateLimitGuards.standard) // 15 requests per minute
  async handleLocationUpdate(client: Socket, data: LocationData) {
    return this.locationService.updateLocation(data);
  }

  // Lenient rate limiting for frequent operations
  @SubscribeMessage('getNearbyVendors')
  @UseGuards(WsRateLimitGuards.lenient) // 30 requests per minute
  async handleGetNearbyVendors(client: Socket, data: LocationData) {
    return this.vendorService.getNearbyVendors(data);
  }

  // Very lenient rate limiting for status checks
  @SubscribeMessage('getStatus')
  @UseGuards(WsRateLimitGuards.status) // 60 requests per minute
  async handleGetStatus(client: Socket) {
    return this.statusService.getStatus();
  }
}
```

### Custom Rate Limits
```typescript
// Create custom rate limiting guard for specific needs
import { createWsRateLimitGuard } from '@app/nest/guards';

const customRateLimit = createWsRateLimitGuard({
  limit: 25,
  windowMs: 60000,
  keyPrefix: 'prod_ws_rate_limit:',
});

@SubscribeMessage('updateLocation')
@UseGuards(customRateLimit)
async handleLocationUpdate(client: Socket, data: LocationData) {
  return this.locationService.updateLocation(data);
}
```

### Rate Limit Status
```typescript
// Get current rate limit status
const guard = new WsRateLimitGuard(redis, {
  limit: 10,
  windowMs: 60000,
});

const status = await guard.getLimitStatus('user-123:updateLocation:socket-456');
console.log(`Current: ${status.current}, Remaining: ${status.remaining}, Reset: ${status.resetTime}`);
```

### Reset Rate Limit
```typescript
// Manually reset rate limit for a specific key
const guard = new WsRateLimitGuard(redis, {
  limit: 10,
  windowMs: 60000,
});

await guard.resetLimit('user-123:updateLocation:socket-456');
```

## Configuration Options

### WsRateLimitOptions
```typescript
interface WsRateLimitOptions {
  limit: number;                    // Number of requests allowed
  windowMs: number;                 // Time window in milliseconds
  keyPrefix?: string;               // Redis key prefix (default: 'ws_rate_limit:')
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean;     // Skip counting failed requests
}
```

### Pre-configured Guards
```typescript
export const WsRateLimitGuards = {
  // Strict rate limiting for critical operations
  strict: createWsRateLimitGuard({
    limit: 5,
    windowMs: 60000, // 5 requests per minute
  }),

  // Standard rate limiting for normal operations
  standard: createWsRateLimitGuard({
    limit: 15,
    windowMs: 60000, // 15 requests per minute
  }),

  // Lenient rate limiting for frequent operations
  lenient: createWsRateLimitGuard({
    limit: 30,
    windowMs: 60000, // 30 requests per minute
  }),

  // Very lenient rate limiting for status checks
  status: createWsRateLimitGuard({
    limit: 60,
    windowMs: 60000, // 60 requests per minute
  }),
};
```

## Rate Limit Key Format

The rate limit key is generated using the following format:
```
{keyPrefix}{userId}:{eventName}:{socketId}
```

Examples:
- `ws_rate_limit:user-123:updateLocation:socket-456`
- `ws_rate_limit:anonymous:getStatus:socket-789`
- `prod_ws_rate_limit:user-456:updateProfile:socket-123`

## Error Handling

### Rate Limit Exceeded
When a rate limit is exceeded, the guard throws a `WsError` with the code `RATE_LIMIT_EXCEEDED`:

```typescript
// Client receives error response
{
  "event": "error",
  "data": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Redis Failures
If Redis is unavailable, the guard allows the request to proceed to prevent service disruption:

```typescript
// Guard logs the error but allows the request
this.logger.error(`Rate limiting error for ${key}:`, error);
return true; // Allow request if rate limiting fails
```

## Monitoring and Metrics

### Rate Limit Status
```typescript
// Get detailed rate limit information
const status = await guard.getLimitStatus(key);
console.log({
  current: status.current,      // Current request count
  limit: status.limit,          // Maximum allowed requests
  remaining: status.remaining,  // Remaining requests
  resetTime: status.resetTime,  // When the limit resets
});
```

### Redis Keys
Monitor these Redis keys for rate limiting metrics:
- `ws_rate_limit:*` - All rate limit keys
- `ws_rate_limit:{userId}:*` - Rate limits for specific users
- `ws_rate_limit:*:{eventName}:*` - Rate limits for specific events

## Best Practices

### 1. **Choose Appropriate Limits**
```typescript
// Location updates: frequent but not too frequent
@UseGuards(new WsRateLimitGuard(redis, {
  limit: 10,
  windowMs: 60000, // 10 updates per minute
}))

// Status checks: more frequent
@UseGuards(new WsRateLimitGuard(redis, {
  limit: 60,
  windowMs: 60000, // 60 checks per minute
}))

// Critical operations: very strict
@UseGuards(new WsRateLimitGuard(redis, {
  limit: 3,
  windowMs: 300000, // 3 operations per 5 minutes
}))
```

### 2. **Use Different Limits for Different User Types**
```typescript
// Premium users get higher limits
const isPremiumUser = await this.userService.isPremium(userId);
const limit = isPremiumUser ? 50 : 10;

@UseGuards(new WsRateLimitGuard(redis, {
  limit,
  windowMs: 60000,
}))
```

### 3. **Monitor Rate Limit Usage**
```typescript
// Log when users approach their limits
const status = await guard.getLimitStatus(key);
if (status.remaining <= 2) {
  this.logger.warn(`User ${userId} approaching rate limit: ${status.remaining} remaining`);
}
```

### 4. **Handle Rate Limit Errors Gracefully**
```typescript
// Client-side error handling
socket.on('error', (error) => {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Show user-friendly message
    showMessage('Please wait before making another request');
    
    // Implement exponential backoff
    setTimeout(() => {
      retryRequest();
    }, 5000);
  }
});
```

## Security Considerations

- **Distributed Rate Limiting**: Uses Redis for consistent limits across multiple server instances
- **User Isolation**: Each user has their own rate limit counter
- **Event Isolation**: Different events can have different rate limits
- **Graceful Degradation**: Service continues to work even if Redis is unavailable
- **Configurable Limits**: Adjust limits based on user roles and operation types

## Performance Considerations

- **Redis Operations**: Each request requires 1-2 Redis operations
- **Key Expiration**: Keys automatically expire after the time window
- **Memory Usage**: Minimal memory usage with automatic cleanup
- **Network Latency**: Redis network calls add minimal latency

## Integration with Monitoring

The rate limiting guard integrates with your existing monitoring system:

```typescript
// Log rate limit events for monitoring
this.logger.warn(`Rate limit exceeded for ${key}: ${current}/${this.options.limit}`);

// Emit metrics for monitoring dashboards
this.metricsService.increment('websocket.rate_limit.exceeded', {
  userId,
  event: eventName,
});
``` 