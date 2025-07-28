# Protocol Buffer Definitions

This library contains generated TypeScript code from Protocol Buffer (protobuf) definitions used for gRPC service communication.

## Purpose

The `proto` library provides:

- **Generated TypeScript Code**: Auto-generated types and service definitions from `.proto` files
- **gRPC Service Contracts**: Type-safe interfaces for service-to-service communication
- **Protocol Definitions**: Shared message formats and service definitions
- **Client/Server Code**: Generated code for both gRPC clients and servers

## Structure

### Definitions

Contains the original `.proto` files that define:

- Service interfaces
- Message types
- RPC method signatures

### Generated Code

TypeScript code generated from the protobuf definitions, including:

- Service interfaces
- Message types
- Client implementations
- Type definitions

## Usage

```typescript
import { CreateUserRequest, UserResponse, UserServiceClient } from '@libs/proto';

// Use generated types for type safety
const request: CreateUserRequest = {
	// Type-safe request data
};

// Use generated service clients
const userService = new UserServiceClient();
const response: UserResponse = await userService.createUser(request);
```

## Generation

The TypeScript code is automatically generated from `.proto` files using `protoc-gen-ts_proto`. To regenerate the code after changes to `.proto` files, run the appropriate build command.

## Benefits

- **Type Safety**: Compile-time checking of gRPC calls
- **Consistency**: Shared definitions across all services
- **Performance**: Efficient binary serialization
- **Interoperability**: Language-agnostic service contracts
- **Documentation**: Protocol definitions serve as API documentation
