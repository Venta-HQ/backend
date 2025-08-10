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
│   ├── shared/                  # Shared utility types
│   │   ├── common.proto         # Common types (Empty, StandardResponse, etc.)
│   │   └── location.proto       # Location-related types
│   └── domains/
│       ├── marketplace/
│       │   ├── user-management.proto      # User management service definitions
│       │   └── vendor-management.proto    # Vendor management service definitions
│       ├── location-services/
│       │   └── geolocation.proto          # Geolocation service definitions
│       └── infrastructure/
│           └── file-management.proto      # File management service definitions
├── lib/
│   ├── google/                  # Google protobuf types
│   ├── shared/                  # Generated shared types
│   ├── marketplace/             # Generated marketplace types
│   ├── location-services/       # Generated location services types
│   ├── infrastructure/          # Generated infrastructure types
│   └── index.ts                 # Main export file
└── index.ts                     # Library entry point
```

### Shared Utilities

The `shared/` directory contains common types used across all domains:

**`shared/common.proto`:**

- `Empty`: Standard empty response
- `StandardResponse`: Success/error response pattern
- `Timestamp`: Consistent timestamp handling
- `PaginationRequest/PaginationMeta`: Standard pagination
- `ErrorDetail/ValidationError`: Error handling types

**`shared/location.proto`:**

- `Location`: Standardized lat/lng coordinates (using `lng` consistently)
- `BoundingBox`: Area-based queries
- `Address`: Street address information
- `FullLocation`: Complete location with coordinates and address

### Domain Organization

Each domain contains:

- **Service definitions**: gRPC service interfaces
- **Message types**: Request/response message structures
- **Enums**: Domain-specific enumerations
- **Comments**: Documentation for each service and message
- **Shared type usage**: References to shared utilities via `shared.common.TypeName`

### Domain Boundaries

**Marketplace Domain:**

- **User Management**: User authentication, profiles, subscriptions, and user-vendor relationships
- **Vendor Management**: Vendor CRUD operations and vendor location management within the marketplace context

**Location Services Domain:**

- **Geolocation**: Pure location services like address geocoding, distance calculations, and coordinate validation
- **No vendor-specific logic**: Location services are domain-agnostic and can be used by any service

### Import Structure

The main `index.proto` file imports shared utilities first, then all domain-specific proto files:

```protobuf
syntax = "proto3";

// Shared utilities - import first so all domains can use them
import "shared/common.proto";
import "shared/location.proto";

// Domain-specific imports
import "domains/marketplace/user-management.proto";
import "domains/marketplace/vendor-management.proto";
import "domains/location-services/geolocation.proto";
import "domains/infrastructure/file-management.proto";
```

## Usage

### Using Shared Types

When creating new proto files, import and use shared types:

```protobuf
syntax = "proto3";

package your.domain;

import "shared/common.proto";
import "shared/location.proto";

service YourService {
  rpc DoSomething (Request) returns (shared.common.Empty) {}
  rpc GetLocations (shared.location.BoundingBox) returns (LocationResponse) {}
}

message LocationResponse {
  repeated shared.location.Location locations = 1;
  shared.common.PaginationMeta pagination = 2;
}
```

### Importing Generated Types

```typescript
import {
	CreateUserData,
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	MARKETPLACE_USER_MANAGEMENT_SERVICE_NAME,
	UserCreatedResponse,
	UserManagementServiceClient,
} from '@venta/proto/marketplace/user-management';

// Use in gRPC client configuration
const client = new UserManagementServiceClient();
const request: CreateUserData = {
	id: 'user-123',
};
```

### Service Registration

```typescript
import { GrpcInstanceModule } from '@venta/nest/modules';
import {
	MARKETPLACE_USER_MANAGEMENT_PACKAGE_NAME,
	MARKETPLACE_USER_MANAGEMENT_SERVICE_NAME,
	UserManagementServiceClient,
} from '@venta/proto/marketplace/user-management';

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
