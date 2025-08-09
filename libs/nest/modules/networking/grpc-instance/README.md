# gRPC Instance Module

## Purpose

The gRPC Instance module provides reusable gRPC client management for the Venta backend system. It includes client connection pooling, retry logic, metadata propagation, and efficient inter-service communication capabilities for microservice architecture.

## Overview

This module provides:

- gRPC client connection management and pooling
- Automatic retry mechanisms for failed requests
- Request context and metadata propagation
- Connection health monitoring and recovery
- Type-safe gRPC client interfaces
- Efficient inter-service communication

## Usage

### Module Registration

Register the gRPC instance module in your service:

```typescript
import { GrpcInstanceModule } from '@venta/nest/modules/grpc-instance';
import { USER_PACKAGE_NAME } from '@venta/proto/user';

@Module({
	imports: [
		GrpcInstanceModule.register<UserServiceClient>({
			proto: 'user.proto',
			protoPackage: USER_PACKAGE_NAME,
			provide: USER_PACKAGE_NAME,
			serviceName: USER_PACKAGE_NAME,
			urlFactory: (configService) => configService.get('USER_SERVICE_ADDRESS'),
		}),
	],
})
export class YourServiceModule {}
```

### Service Injection

Inject gRPC clients for inter-service communication:

```typescript
import { GrpcInstanceService } from '@venta/nest/modules/grpc-instance';
import { UserServiceClient } from '@venta/proto/user';

@Injectable()
export class YourService {
	constructor(private readonly grpcInstance: GrpcInstanceService) {}

	async getUserData(userId: string) {
		const client = this.grpcInstance.getClient<UserServiceClient>('user');
		return client.getUser({ id: userId });
	}

	async createUser(userData: any) {
		const client = this.grpcInstance.getClient<UserServiceClient>('user');
		return client.createUser(userData);
	}
}
```

### Multiple Service Connections

Configure multiple gRPC service connections:

```typescript
@Module({
	imports: [
		// User service connection
		GrpcInstanceModule.register<UserServiceClient>({
			proto: 'user.proto',
			protoPackage: USER_PACKAGE_NAME,
			provide: USER_PACKAGE_NAME,
			serviceName: USER_PACKAGE_NAME,
			urlFactory: (configService) => configService.get('USER_SERVICE_ADDRESS'),
		}),
		// Vendor service connection
		GrpcInstanceModule.register<VendorServiceClient>({
			proto: 'vendor.proto',
			protoPackage: VENDOR_PACKAGE_NAME,
			provide: VENDOR_PACKAGE_NAME,
			serviceName: VENDOR_PACKAGE_NAME,
			urlFactory: (configService) => configService.get('VENDOR_SERVICE_ADDRESS'),
		}),
	],
})
export class GatewayModule {}
```

### Connection Management

Manage gRPC connections efficiently:

```typescript
// Get client for specific service
const userClient = this.grpcInstance.getClient<UserServiceClient>('user');
const vendorClient = this.grpcInstance.getClient<VendorServiceClient>('vendor');

// Make service calls with automatic retry
const user = await userClient.getUser({ id: userId });
const vendor = await vendorClient.getVendor({ id: vendorId });
```

### Error Handling

Handle gRPC communication errors:

```typescript
async callExternalService(userId: string) {
  try {
    const client = this.grpcInstance.getClient<UserServiceClient>('user');
    const result = await client.getUser({ id: userId });
    return result;
  } catch (error) {
    // Handle gRPC communication errors
    this.logger.error('gRPC call failed', { userId, error: error.message });
    throw new AppError('Service unavailable', ErrorCodes.SERVICE_UNAVAILABLE);
  }
}
```

### Environment Configuration

Configure gRPC service addresses:

```env
# gRPC Service Addresses
USER_SERVICE_ADDRESS=localhost:5000
VENDOR_SERVICE_ADDRESS=localhost:5005
LOCATION_SERVICE_ADDRESS=localhost:5001

# Connection Settings
GRPC_CONNECTION_TIMEOUT=5000
GRPC_MAX_RETRIES=3
GRPC_RETRY_DELAY=1000
```

## Key Benefits

- **Performance**: Efficient connection pooling and reuse
- **Reliability**: Automatic retry mechanisms and error handling
- **Maintainability**: Centralized gRPC client management
- **Observability**: Request tracking and metadata propagation
- **Type Safety**: Type-safe gRPC client interfaces
- **Scalability**: Handles multiple service connections efficiently

## Dependencies

- **gRPC** for high-performance inter-service communication
- **NestJS** for module framework and dependency injection
- **TypeScript** for type definitions
