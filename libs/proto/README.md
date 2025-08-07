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
│       ├── marketplace/
│       │   ├── user-management/
│       │   │   └── user-management.proto  # User management service definitions
│       │   └── vendor-management/
│       │       └── vendor-management.proto # Vendor management service definitions
│       └── location-services/
│           └── geolocation/
│               └── geolocation.proto      # Geolocation service definitions
├── lib/
│   ├── google/                  # Google protobuf types
│   ├── marketplace/             # Generated marketplace types
│   ├── location-services/       # Generated location services types
│   └── index.ts                 # Main export file
└── index.ts                     # Library entry point
```

### Domain Organization

Each domain contains:

- **Service definitions**: gRPC service interfaces
- **Message types**: Request/response message structures
- **Enums**: Domain-specific enumerations
- **Comments**: Documentation for each service and message

### Domain Boundaries

**Marketplace Domain:**

- **User Management**: User authentication, profiles, subscriptions, and user-vendor relationships
- **Vendor Management**: Vendor CRUD operations and vendor location management within the marketplace context

**Location Services Domain:**

- **Geolocation**: Pure location services like address geocoding, distance calculations, and coordinate validation
- **No vendor-specific logic**: Location services are domain-agnostic and can be used by any service

### Import Structure

The main `index.proto` file imports all domain-specific proto files:

```protobuf
syntax = "proto3";

// Import domain-specific protocol buffers
// Marketplace domain
import public "domains/marketplace/user-management/user-management.proto";
import public "domains/marketplace/vendor-management/vendor-management.proto";

// Location services domain
import public "domains/location-services/geolocation/geolocation.proto";
```

## Usage

### Importing Generated Types

```typescript
import {
	CreateUserData,
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	MARKETPLACE_USER_MANAGEMENT_SERVICE_NAME,
	UserCreatedResponse,
	UserManagementServiceClient,
} from '@app/proto/marketplace/user-management';

// Use in gRPC client configuration
const client = new UserManagementServiceClient();
const request: CreateUserData = {
	id: 'user-123',
};
```

### Service Registration

```typescript
import { GrpcInstanceModule } from '@app/nest/modules';
import {
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	MARKETPLACE_USER_MANAGEMENT_SERVICE_NAME,
	UserManagementServiceClient,
} from '@app/proto/marketplace/user-management';

@Module({
	imports: [
		GrpcInstanceModule.register<UserManagementServiceClient>({
			proto: 'domains/marketplace/user-management/user-management.proto',
			protoPackage: MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
			provide: MARKETPLACE_USER_MANAGEMENT_SERVICE_NAME,
			serviceName: MARKETPLACE_USER_MANAGEMENT_SERVICE_NAME,
			urlFactory: (configService: ConfigService) =>
				configService.get('USER_MANAGEMENT_SERVICE_ADDRESS') || 'localhost:5000',
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
