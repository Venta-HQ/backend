# Protocol Buffer Definitions

This library contains generated TypeScript code from Protocol Buffer (protobuf) definitions used for gRPC service communication.

## Purpose

The `proto` library provides:

- **Generated TypeScript Code**: Auto-generated types and service definitions from `.proto` files
- **gRPC Service Contracts**: Type-safe interfaces for service-to-service communication
- **Protocol Definitions**: Shared message formats and service definitions
- **Type Definitions**: Generated TypeScript types for request/response objects

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
- Type definitions
- Package constants

## Usage

### Importing Generated Types

Import the generated types and constants for type-safe gRPC communication:

```typescript
import {
	LOCATION_SERVICE_NAME,
	LocationServiceClient,
	LocationUpdate,
	VendorLocationRequest,
} from '@app/proto/location';
import { ClerkUserData, USER_SERVICE_NAME, UserServiceClient, UserVendorData } from '@app/proto/user';
import { VENDOR_SERVICE_NAME, VendorCreateData, VendorServiceClient, VendorUpdateData } from '@app/proto/vendor';
```

### Service Client Usage

Use the generated service clients with the gRPC instance service:

```typescript
import { GrpcInstance } from '@app/grpc';
import { LocationServiceClient, LocationUpdate } from '@app/proto/location';

@Injectable()
export class LocationService {
	private readonly locationClient: LocationServiceClient;

	constructor() {
		this.locationClient = GrpcInstance.getClient<LocationServiceClient>('location-service');
	}

	async updateVendorLocation(vendorId: string, location: { lat: number; long: number }) {
		const request: LocationUpdate = {
			entityId: vendorId,
			location: {
				lat: location.lat,
				long: location.long,
			},
		};

		return await this.locationClient.updateVendorLocation(request);
	}
}
```

### Type Safety

Use the generated types for compile-time safety:

```typescript
import { VendorCreateData, VendorUpdateData } from '@app/proto/vendor';

@Injectable()
export class VendorService {
	async createVendor(data: VendorCreateData) {
		// Type-safe vendor creation
		return await this.vendorClient.createVendor(data);
	}

	async updateVendor(id: string, data: VendorUpdateData) {
		// Type-safe vendor updates
		return await this.vendorClient.updateVendor({ id, ...data });
	}
}
```

### Real-world Examples

Here's how the proto library is used in the actual codebase:

```typescript
// Gateway vendor controller
import { CreateVendorData, UpdateVendorData, VENDOR_SERVICE_NAME, VendorServiceClient } from '@app/proto/vendor';

@Controller('vendor')
export class VendorController {
	constructor(@Inject(VENDOR_SERVICE_NAME) private readonly vendorClient: VendorServiceClient) {}

	@Post()
	async createVendor(@Body() data: CreateVendorData) {
		return await this.vendorClient.createVendor(data);
	}
}
```

```typescript
// User service clerk controller
import { ClerkUserData, USER_SERVICE_NAME } from '@app/proto/user';

@Controller()
export class ClerkController {
	@Post('handleUserCreated')
	async handleUserCreated(@Body() data: ClerkUserData) {
		// Process clerk user creation
		return { success: true };
	}
}
```

## Generation

The TypeScript code is automatically generated from `.proto` files using `protoc-gen-ts_proto`. To regenerate the code after changes to `.proto` files, run the appropriate build command.

## Benefits

- **Type Safety**: Compile-time checking of gRPC message structures
- **Consistency**: Shared definitions across all services
- **Performance**: Efficient binary serialization
- **Interoperability**: Language-agnostic service contracts
- **Documentation**: Protocol definitions serve as API documentation

## Available Services

- **LocationService**: Location management and vendor location updates
- **UserService**: User management, Clerk integration, and vendor associations
- **VendorService**: Vendor CRUD operations and management
