# Logger Library

This library provides structured logging and request context management for the Venta backend services.

## Overview

The logger library provides centralized logging capabilities with structured output, request context tracking, and gRPC logging integration. It ensures consistent logging across all services with proper context and formatting.

## Features

- **Structured Logging**: Consistent, structured log output
- **Request Context**: Track and correlate logs across request lifecycle
- **gRPC Logging**: Specialized logging for gRPC requests and responses
- **Log Levels**: Configurable log levels and filtering
- **Context Correlation**: Correlate logs across service boundaries

## Usage

### Basic Logging

Use the logger service to output structured logs with appropriate log levels.

```typescript
import { Logger } from '@app/logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	async createUser(userData: CreateUserInput) {
		this.logger.log('Creating new user', { email: userData.email });

		try {
			const user = await this.prisma.user.create({ data: userData });
			this.logger.log('User created successfully', { userId: user.id });
			return user;
		} catch (error) {
			this.logger.error('Failed to create user', {
				error: error.message,
				email: userData.email,
			});
			throw error;
		}
	}
}
```

### Request Context

Access request context information to correlate logs across the request lifecycle.

```typescript
import { RequestContextService } from '@app/logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderService {
	constructor(private readonly requestContext: RequestContextService) {}

	async processOrder(orderId: string) {
		const requestId = this.requestContext.getRequestId();
		const userId = this.requestContext.getUserId();

		this.logger.log('Processing order', {
			requestId,
			userId,
			orderId,
		});

		// Process order logic
	}
}
```

### gRPC Logging

Apply gRPC logging interceptors to automatically log request/response information.

```typescript
import { GrpcLoggerInterceptor } from '@app/logger';
import { Module } from '@nestjs/common';

@Module({
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: GrpcLoggerInterceptor,
		},
	],
})
export class AppModule {}
```

## Dependencies

- Winston for logging framework
- NestJS for framework integration
