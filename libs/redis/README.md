# Redis Library

This library provides Redis caching and session management utilities for the Venta backend services.

## Overview

The Redis library manages Redis connections, provides caching utilities, and handles session storage. It offers a clean interface for Redis operations including caching, session management, and distributed locking.

## Features

- **Redis Connection Management**: Handle Redis connections and lifecycle
- **Caching Utilities**: High-performance caching for frequently accessed data
- **Session Storage**: Distributed session management
- **Connection Pooling**: Efficient Redis connection pooling
- **Distributed Locking**: Redis-based distributed locking mechanisms

## Usage

### Caching

Use Redis for caching frequently accessed data to improve application performance.

```typescript
import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
	constructor(private readonly redis: RedisService) {}

	async getUser(id: string) {
		// Try to get from cache first
		const cached = await this.redis.get(`user:${id}`);
		if (cached) {
			return JSON.parse(cached);
		}

		// Fetch from database
		const user = await this.prisma.user.findUnique({ where: { id } });

		// Cache for 1 hour
		await this.redis.setex(`user:${id}`, 3600, JSON.stringify(user));

		return user;
	}

	async invalidateUserCache(id: string) {
		await this.redis.del(`user:${id}`);
	}
}
```

### Session Management

Store and manage user sessions across multiple service instances.

```typescript
import { RedisService } from '@app/redis';

@Injectable()
export class SessionService {
	constructor(private readonly redis: RedisService) {}

	async createSession(userId: string, sessionData: any) {
		const sessionId = crypto.randomUUID();
		await this.redis.setex(
			`session:${sessionId}`,
			86400, // 24 hours
			JSON.stringify({ userId, ...sessionData }),
		);
		return sessionId;
	}

	async getSession(sessionId: string) {
		const session = await this.redis.get(`session:${sessionId}`);
		return session ? JSON.parse(session) : null;
	}

	async deleteSession(sessionId: string) {
		await this.redis.del(`session:${sessionId}`);
	}
}
```

### Distributed Operations

Leverage Redis for distributed locking and coordination between services.

```typescript
import { RedisService } from '@app/redis';

@Injectable()
export class OrderService {
	constructor(private readonly redis: RedisService) {}

	async processOrder(orderId: string) {
		const lockKey = `lock:order:${orderId}`;

		// Acquire distributed lock
		const acquired = await this.redis.set(lockKey, 'locked', 'PX', 30000, 'NX');

		if (!acquired) {
			throw new Error('Order is being processed by another instance');
		}

		try {
			// Process order logic
			await this.processOrderLogic(orderId);
		} finally {
			// Release lock
			await this.redis.del(lockKey);
		}
	}
}
```

## Dependencies

- Redis for caching and session storage
- NestJS for framework integration
