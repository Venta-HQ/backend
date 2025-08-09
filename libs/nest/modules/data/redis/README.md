# Redis Module

## Purpose

The Redis module provides caching and session management capabilities for the Venta backend system. It includes Redis client integration, caching operations, distributed session storage, and connection management for high-performance data storage and retrieval.

## Overview

This module provides:

- Redis client integration and connection management
- Caching operations with configurable TTL
- Distributed session storage and management
- Connection pooling and optimization
- Cache invalidation and management
- Session persistence and security

## Usage

### Module Registration

The module is automatically included via BootstrapModule in all services:

```typescript
// Automatically included in BootstrapModule.forRoot()
BootstrapModule.forRoot({
	appName: 'Your Service',
	protocol: 'http',
	// RedisModule is automatically registered
});
```

### Service Injection

Inject RedisService for caching and session operations:

```typescript
import { RedisService } from '@venta/nest/modules/redis';

@Injectable()
export class YourService {
	constructor(private readonly redisService: RedisService) {}

	async getUserFromCache(userId: string) {
		const cached = await this.redisService.get(`user:${userId}`);
		if (cached) {
			return JSON.parse(cached);
		}
		return null;
	}

	async cacheUser(userId: string, userData: any) {
		await this.redisService.set(
			`user:${userId}`,
			JSON.stringify(userData),
			3600, // TTL in seconds
		);
	}
}
```

### Caching Operations

Perform caching operations with Redis:

```typescript
// Get cached data
async getCachedData(key: string) {
  return this.redisService.get(key);
}

// Set cached data with TTL
async setCachedData(key: string, data: any, ttl?: number) {
  return this.redisService.set(key, JSON.stringify(data), ttl);
}

// Delete cached data
async invalidateCache(key: string) {
  await this.redisService.del(key);
}

// Check if key exists
async keyExists(key: string) {
  return this.redisService.exists(key);
}

// Set expiration time
async setExpiration(key: string, ttl: number) {
  await this.redisService.expire(key, ttl);
}
```

### Session Management

Manage user sessions with Redis:

```typescript
// Store user session
async storeSession(sessionId: string, sessionData: any) {
  await this.redisService.set(
    `session:${sessionId}`,
    JSON.stringify(sessionData),
    86400 // 24 hours
  );
}

// Retrieve user session
async getSession(sessionId: string) {
  const session = await this.redisService.get(`session:${sessionId}`);
  return session ? JSON.parse(session) : null;
}

// Delete user session
async deleteSession(sessionId: string) {
  await this.redisService.del(`session:${sessionId}`);
}

// Update session TTL
async extendSession(sessionId: string, ttl: number) {
  await this.redisService.expire(`session:${sessionId}`, ttl);
}
```

### Advanced Operations

Use advanced Redis operations:

```typescript
// Hash operations
async setHashField(key: string, field: string, value: any) {
  await this.redisService.hset(key, field, JSON.stringify(value));
}

async getHashField(key: string, field: string) {
  const value = await this.redisService.hget(key, field);
  return value ? JSON.parse(value) : null;
}

// List operations
async pushToList(key: string, value: any) {
  await this.redisService.lpush(key, JSON.stringify(value));
}

async popFromList(key: string) {
  const value = await this.redisService.rpop(key);
  return value ? JSON.parse(value) : null;
}

// Set operations
async addToSet(key: string, value: any) {
  await this.redisService.sadd(key, JSON.stringify(value));
}

async getSetMembers(key: string) {
  const members = await this.redisService.smembers(key);
  return members.map(member => JSON.parse(member));
}
```

### Environment Configuration

Configure Redis connection:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Connection Settings
REDIS_CONNECTION_TIMEOUT=5000
REDIS_RETRY_DELAY=1000
REDIS_MAX_RETRIES=3

# Cache Settings
REDIS_CACHE_TTL=3600
REDIS_SESSION_TTL=86400
```

## Key Benefits

- **Performance**: Fast caching for improved response times
- **Scalability**: Distributed caching across multiple instances
- **Session Management**: Reliable session storage and retrieval
- **Flexibility**: Configurable TTL and cache strategies
- **Reliability**: Connection pooling and automatic reconnection
- **Security**: Secure session storage and management
- **Monitoring**: Connection health monitoring and metrics

## Dependencies

- **Redis** for caching and session storage
- **NestJS** for module framework and dependency injection
- **Redis Client** for Redis connection and operations
