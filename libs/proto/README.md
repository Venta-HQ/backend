# Protocol Buffers Library

## Purpose

The Protocol Buffers library provides gRPC service definitions and generated TypeScript code for inter-service communication in the Venta backend system. It defines the contract between microservices and ensures type-safe communication.

## What It Contains

- **Service Definitions**: Protocol buffer definitions for all microservices
- **Generated Code**: TypeScript interfaces and classes for gRPC communication
- **Type Definitions**: Request/response types for all service methods
- **Client/Server Code**: Generated gRPC client and server implementations

## Usage

This library is used by all microservices and the gateway to establish type-safe gRPC communication channels.

### For Microservices (Server Implementation)
```typescript
// Import generated interfaces for service implementation
import { 
  UserServiceController, 
  UserServiceControllerMethods,
  CreateUserRequest,
  CreateUserResponse,
  GetUserRequest,
  GetUserResponse
} from '@app/proto/user';

@Controller()
@UserServiceControllerMethods()
export class UserController implements UserServiceController {
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    const user = await this.userService.createUser({
      email: request.email,
      name: request.name,
      age: request.age
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age
      }
    };
  }

  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    const user = await this.userService.getUser(request.id);
    
    if (!user) {
      throw new AppError('User not found', ErrorCodes.NOT_FOUND);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age
      }
    };
  }
}
```

### For Gateway (Client Usage)
```typescript
// Import generated client interfaces
import { 
  UserServiceClient,
  CreateUserRequest,
  GetUserRequest 
} from '@app/proto/user';

@Injectable()
export class UserGatewayService {
  constructor(
    private readonly grpcInstance: GrpcInstanceService
  ) {}

  async createUser(data: CreateUserRequest) {
    const client = this.grpcInstance.getClient<UserServiceClient>('user');
    
    return client.createUser({
      email: data.email,
      name: data.name,
      age: data.age
    });
  }

  async getUser(id: string) {
    const client = this.grpcInstance.getClient<UserServiceClient>('user');
    
    return client.getUser({ id });
  }
}
```

### For Service Module Configuration
```typescript
// Configure gRPC service in module
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_PACKAGE_NAME } from '@app/proto/user';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: USER_PACKAGE_NAME,
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(__dirname, '../proto/src/definitions/user.proto'),
          url: process.env.USER_SERVICE_ADDRESS || 'localhost:5000'
        }
      }
    ])
  ],
  providers: [UserGatewayService],
  exports: [UserGatewayService]
})
export class UserGatewayModule {}
```

### For Type Definitions
```typescript
// Use generated types for type safety
import { 
  User, 
  Vendor, 
  Location,
  CreateUserRequest,
  UpdateVendorRequest 
} from '@app/proto';

// Type-safe request/response handling
async function handleUserCreation(request: CreateUserRequest): Promise<User> {
  // TypeScript will ensure type safety
  const user = await userService.createUser(request);
  return user;
}

// Type-safe vendor operations
async function handleVendorUpdate(request: UpdateVendorRequest): Promise<Vendor> {
  const vendor = await vendorService.updateVendor(request);
  return vendor;
}
```

## Key Benefits

- **Type Safety**: Compile-time checking of service contracts
- **Performance**: Efficient binary serialization for inter-service communication
- **Consistency**: Enforced service contracts prevent breaking changes
- **Documentation**: Self-documenting service interfaces

## Dependencies

- Protocol Buffers compiler
- gRPC for service communication
- TypeScript for type definitions 