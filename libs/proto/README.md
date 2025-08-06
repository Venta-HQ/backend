# Protocol Buffers Library

## Purpose

The Protocol Buffers library provides gRPC service definitions and generated TypeScript code for inter-service communication in the Venta backend system. It defines the contract between microservices and ensures type-safe communication through standardized proto file management and path resolution.

## Overview

This library provides:

- Protocol buffer definitions for all microservices
- Generated TypeScript interfaces and classes for gRPC communication
- Type definitions for request/response structures
- Client and server implementations for gRPC services
- Standardized proto file path resolution utilities
- Service contract enforcement across the system

## Usage

### Proto File Path Resolution

Use the standardized approach for resolving proto file paths:

```typescript
import { ProtoPathUtil } from '@app/proto';

// Resolve proto file by filename (recommended)
const protoPath = ProtoPathUtil.resolveProtoPath('user.proto');

// Resolve from current working directory
const protoPath = ProtoPathUtil.resolveFromCwd('libs/proto/src/definitions/user.proto');
```

### Service Implementation (Microservices)

Implement gRPC services using generated interfaces:

```typescript
import {
	CreateUserRequest,
	CreateUserResponse,
	UserServiceController,
	UserServiceControllerMethods,
} from '@app/proto/user';

@Controller()
@UserServiceControllerMethods()
export class UserController implements UserServiceController {
	async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
		const user = await this.userService.createUser({
			email: request.email,
			name: request.name,
		});

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
			},
		};
	}
}
```

### Client Usage (Gateway)

Use generated clients for service communication:

```typescript
import { CreateUserRequest, GetUserRequest, UserServiceClient } from '@app/proto/user';

@Injectable()
export class UserGatewayService {
	constructor(private readonly grpcInstance: GrpcInstanceService) {}

	async createUser(data: CreateUserRequest) {
		const client = this.grpcInstance.getClient<UserServiceClient>('user');
		return client.createUser(data);
	}

	async getUser(id: string) {
		const client = this.grpcInstance.getClient<UserServiceClient>('user');
		return client.getUser({ id });
	}
}
```

### Module Configuration

Configure gRPC services in your modules:

```typescript
import { USER_PACKAGE_NAME } from '@app/proto/user';

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
export class UserGatewayModule {}
```

### Type Definitions

Use generated types for type safety:

```typescript
import { CreateUserRequest, Location, UpdateVendorRequest, User, Vendor } from '@app/proto';

// Type-safe request/response handling
async function handleUserCreation(request: CreateUserRequest): Promise<User> {
	const user = await userService.createUser(request);
	return user;
}

// Type-safe vendor operations
async function handleVendorUpdate(request: UpdateVendorRequest): Promise<Vendor> {
	const vendor = await vendorService.updateVendor(request);
	return vendor;
}
```

### Best Practices

1. **Use filename-only approach** for proto paths:

   ```typescript
   // ✅ Recommended
   protoPath: 'user.proto';

   // ❌ Avoid
   protoPath: '../proto/src/definitions/user.proto';
   ```

2. **Use generated interfaces** for type safety:

   ```typescript
   // ✅ Use generated types
   import { CreateUserRequest } from '@app/proto/user';

   // ❌ Avoid manual type definitions
   interface CreateUserRequest { ... }
   ```

3. **Use service packages** for client management:

   ```typescript
   // ✅ Use package names
   const client = this.grpcInstance.getClient<UserServiceClient>('user');

   // ❌ Avoid direct client instantiation
   const client = new UserServiceClient();
   ```

## Key Benefits

- **Type Safety**: Compile-time checking of service contracts
- **Performance**: Efficient binary serialization for inter-service communication
- **Consistency**: Enforced service contracts prevent breaking changes
- **Documentation**: Self-documenting service interfaces
- **Standardization**: Consistent proto file management across the system

## Dependencies

- **Protocol Buffers** for service definition and serialization
- **gRPC** for high-performance inter-service communication
- **TypeScript** for type definitions and compile-time safety
