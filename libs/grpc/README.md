# gRPC Library

This library provides gRPC client and server utilities for the Venta backend services.

## Overview

The gRPC library manages gRPC connections, provides client instances for microservice communication, and handles gRPC-specific configuration. It enables efficient, type-safe communication between microservices.

## Features

- **gRPC Client Management**: Create and manage gRPC client connections
- **Service Discovery**: Automatic service discovery and connection management
- **Connection Pooling**: Efficient connection pooling for microservice communication
- **Type Safety**: Type-safe gRPC client interfaces
- **Load Balancing**: Built-in load balancing for service instances

## Usage

### gRPC Client

Create gRPC client instances to communicate with other microservices.

```typescript
import { GrpcInstance } from '@app/grpc';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
	private readonly userClient: UserServiceClient;

	constructor() {
		this.userClient = GrpcInstance.getClient<UserServiceClient>('user-service');
	}

	async getUser(id: string) {
		return await this.userClient.getUser({ id });
	}

	async createUser(data: CreateUserRequest) {
		return await this.userClient.createUser(data);
	}
}
```

### Service Communication

Use the provided client to make type-safe calls to other services.

```typescript
import { GrpcInstance } from '@app/grpc';

@Injectable()
export class OrderService {
	private readonly userClient: UserServiceClient;
	private readonly paymentClient: PaymentServiceClient;

	constructor() {
		this.userClient = GrpcInstance.getClient<UserServiceClient>('user-service');
		this.paymentClient = GrpcInstance.getClient<PaymentServiceClient>('payment-service');
	}

	async processOrder(orderData: CreateOrderRequest) {
		// Verify user exists
		const user = await this.userClient.getUser({ id: orderData.userId });

		// Process payment
		const payment = await this.paymentClient.processPayment({
			amount: orderData.amount,
			userId: orderData.userId,
		});

		return { user, payment };
	}
}
```

### Connection Management

The library handles connection lifecycle, including connection pooling and service discovery.

```typescript
import { GrpcInstanceModule } from '@app/grpc';

@Module({
	imports: [GrpcInstanceModule],
	providers: [UserService, OrderService],
})
export class AppModule {}
```

## Dependencies

- gRPC for microservice communication
- NestJS for framework integration
