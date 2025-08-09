# WebSocket Rate Limiting Guard

## Purpose

The WebSocket Rate Limiting Guard provides rate limiting capabilities for WebSocket connections in the Venta backend system. It prevents abuse of WebSocket endpoints by limiting the number of requests per user within a specified time window using Redis-based distributed rate limiting.

## Overview

This guard provides:

- Redis-based distributed rate limiting across multiple server instances
- Configurable rate limits per user and event type
- Pre-configured guard instances for common use cases
- Graceful degradation when rate limiting fails
- Comprehensive monitoring and metrics
- Automatic key expiration and cleanup

## Usage

### Basic Rate Limiting

Apply rate limiting to WebSocket methods:

```typescript
import { WsRateLimitGuards } from '@venta/nest/guards';

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

Apply appropriate rate limits based on operation type:

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

Create custom rate limiting guards for specific needs:

```typescript
import { createWsRateLimitGuard } from '@venta/nest/guards';

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

### Pre-configured Guards

Use the available pre-configured rate limiting guards:

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

### Error Handling

Handle rate limit exceeded errors:

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

### Rate Limit Status

Get current rate limit status for monitoring:

```typescript
const guard = new WsRateLimitGuard(redis, {
	limit: 10,
	windowMs: 60000,
});

const status = await guard.getLimitStatus('user-123:updateLocation:socket-456');
console.log(`Current: ${status.current}, Remaining: ${status.remaining}, Reset: ${status.resetTime}`);
```

## Configuration Options

### Rate Limit Options

```typescript
interface WsRateLimitOptions {
	limit: number; // Number of requests allowed
	windowMs: number; // Time window in milliseconds
	keyPrefix?: string; // Redis key prefix
	skipSuccessfulRequests?: boolean; // Skip counting successful requests
	skipFailedRequests?: boolean; // Skip counting failed requests
}
```

### Rate Limit Key Format

The rate limit key is generated using the format:

```
{keyPrefix}{userId}:{eventName}:{socketId}
```

Examples:

- `ws_rate_limit:user-123:updateLocation:socket-456`
- `ws_rate_limit:anonymous:getStatus:socket-789`

## Key Benefits

- **Abuse Prevention**: Protects WebSocket endpoints from abuse
- **Fair Usage**: Ensures fair usage across all users
- **Distributed**: Works across multiple server instances
- **Configurable**: Flexible rate limiting based on operation type
- **Graceful Degradation**: Service continues when rate limiting fails
- **Monitoring**: Comprehensive metrics and monitoring capabilities
- **Performance**: Efficient Redis-based implementation

## Dependencies

- **Redis** for distributed rate limiting storage
- **NestJS** for WebSocket guard framework
