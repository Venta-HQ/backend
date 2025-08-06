# Protocol Buffers Library

## Purpose

The Protocol Buffers library provides gRPC service definitions and generated TypeScript types for inter-service communication in the Venta backend system. It ensures type-safe and efficient communication between microservices.

## Overview

This library provides:
- **Domain-specific service definitions** organized by business domain
- **Generated TypeScript types** for type-safe gRPC communication
- **Service contracts** that define the API between microservices
- **Consistent patterns** for request/response structures
- **Shared message types** for common data structures

## Organization

### Domain Structure

```
libs/proto/src/
├── definitions/
│   ├── index.proto              # Main proto file with imports
│   └── domains/
│       ├── user/
│       │   └── user.proto       # User service definitions
│       ├── vendor/
│       │   └── vendor.proto     # Vendor service definitions
│       └── location/
│           └── location.proto   # Location service definitions
├── lib/
│   ├── google/                  # Google protobuf types
│   ├── location.ts              # Generated location types
│   ├── user.ts                  # Generated user types
│   ├── vendor.ts                # Generated vendor types
│   └── index.ts                 # Main export file
└── index.ts                     # Library entry point
```

### Domain Organization

Each domain contains:
- **Service definitions**: gRPC service interfaces
- **Message types**: Request/response message structures
- **Enums**: Domain-specific enumerations
- **Comments**: Documentation for each service and message

### Import Structure

The main `index.proto` file imports all domain-specific proto files:

```protobuf
syntax = "proto3";

// Import domain-specific protocol buffers
import public "domains/user/user.proto";
import public "domains/location/location.proto";
import public "domains/vendor/vendor.proto";
```

## Usage

### Importing Generated Types

```typescript
import { 
  UserServiceClient,
  UserCreateRequest,
  UserResponse,
  USER_PACKAGE_NAME,
  USER_SERVICE_NAME
} from '@app/proto/user';

// Use in gRPC client configuration
const client = new UserServiceClient();
const request: UserCreateRequest = {
  email: 'user@example.com',
  name: 'John Doe'
};
```

### Service Registration

```typescript
import { GrpcInstanceModule } from '@app/nest/modules';
import { USER_PACKAGE_NAME, USER_SERVICE_NAME, UserServiceClient } from '@app/proto/user';

@Module({
  imports: [
    GrpcInstanceModule.register<UserServiceClient>({
      proto: 'domains/user/user.proto',
      protoPackage: USER_PACKAGE_NAME,
      provide: USER_SERVICE_NAME,
      serviceName: USER_SERVICE_NAME,
      urlFactory: (configService: ConfigService) => 
        configService.get('USER_SERVICE_ADDRESS') || 'localhost:5000',
    }),
  ],
})
export class YourModule {}
```

### Building Protocol Buffers

```bash
# Build all proto files
pnpm run build-proto

# This generates TypeScript types in libs/proto/src/lib/
```

## Benefits

- **Domain-driven organization** for better maintainability
- **Type safety** in gRPC communication
- **Clear service contracts** between microservices
- **Consistent patterns** for all service definitions
- **Easy discovery** of available services by domain
- **Generated types** reduce manual type definition work

## Development Workflow

1. **Add new service**: Create a new proto file in the appropriate domain directory
2. **Update imports**: Add the import to `index.proto`
3. **Build types**: Run `pnpm run build-proto` to generate TypeScript types
4. **Update services**: Use the generated types in your microservices
