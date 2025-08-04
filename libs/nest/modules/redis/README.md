# Redis Module

## Purpose

The Redis module provides caching and session management capabilities for the Venta backend system. It includes Redis client integration, caching operations, and distributed session storage.

## What It Contains

- **Redis Service**: Main Redis service with client integration
- **Caching Operations**: Get, set, delete, and cache management
- **Session Storage**: Distributed session management
- **Connection Management**: Redis connection pooling and management

## Usage

This module is imported by services that need caching or session management capabilities.

### For Services
```typescript
// Import the Redis module in your service module
import { RedisModule } from '@app/nest/modules/redis';

@Module({
  imports: [RedisModule],
  // ... other module configuration
})
export class MyServiceModule {}
```

### For Caching Operations
```typescript
// Inject the Redis service in your service
import { RedisService } from '@app/nest/modules/redis';

@Injectable()
export class MyService {
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
      3600 // TTL in seconds
    );
  }

  async invalidateUserCache(userId: string) {
    await this.redisService.del(`user:${userId}`);
  }

  async getCachedData(key: string) {
    return this.redisService.get(key);
  }

  async setCachedData(key: string, data: any, ttl?: number) {
    return this.redisService.set(key, JSON.stringify(data), ttl);
  }
}
```

### For Session Management
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
```

## Key Benefits

- **Performance**: Fast caching for improved response times
- **Scalability**: Distributed caching across multiple instances
- **Session Management**: Reliable session storage and retrieval
- **Flexibility**: Configurable TTL and cache strategies

## Dependencies

- Redis server
- NestJS framework
- TypeScript for type definitions 