# API Type Definitions

This library contains shared TypeScript types, interfaces, and validation schemas that define the contracts between different services in the Venta backend.

## Purpose

The `apitypes` library ensures type safety and consistency across service boundaries by providing:

- **Shared Interfaces**: Common data structures used across services
- **Validation Schemas**: Zod schemas for runtime validation
- **Type Definitions**: TypeScript types for compile-time safety
- **API Contracts**: Clear definitions of data exchange formats

## Available Types

### Location Types

Types and schemas for location-related data structures.

```typescript
import { LocationSchemas, LocationTypes } from '@app/apitypes/lib/location';

// Location data types
interface Location {
	lat: number;
	long: number;
}

// Location validation schemas
const locationSchema = LocationSchemas.location;
```

### User Types

Types and schemas for user management and authentication.

```typescript
import { UserSchemas } from '@app/apitypes/lib/user';

// User validation schemas
const clerkUserDataSchema = UserSchemas.clerkUserData;
```

### Vendor Types

Types and schemas for vendor-related data structures.

```typescript
import { VendorSchemas, VendorTypes } from '@app/apitypes/lib/vendor';

// Vendor data types
interface CreateVendorData {
	name: string;
	description?: string;
	// ... other vendor fields
}

// Vendor validation schemas
const createVendorSchema = VendorSchemas.createVendor;
const updateVendorSchema = VendorSchemas.updateVendor;
```

### Subscription Types

Types and schemas for subscription and billing data.

```typescript
import { SubscriptionTypes } from '@app/apitypes/lib/subscription';

// Subscription data types
interface SubscriptionData {
	// Subscription-related fields
}
```

### Helper Types

Common utility types used across the application.

```typescript
import { AuthedRequest } from '@app/apitypes/lib/helpers';

// Extended Express Request with authenticated user
type AuthedRequest = Request & {
	userId: string;
};
```

## Usage

### Type Safety

Use types for compile-time safety across service boundaries:

```typescript
import { AuthedRequest } from '@app/apitypes/lib/helpers';
import { CreateVendorData, UpdateVendorData } from '@app/apitypes/lib/vendor';

@Controller('vendor')
export class VendorController {
	@Post()
	async createVendor(@Body() data: CreateVendorData, @Req() req: AuthedRequest) {
		// Type-safe vendor creation with authenticated user
		return await this.vendorService.createVendor(data, req.userId);
	}

	@Put(':id')
	async updateVendor(@Param('id') id: string, @Body() data: UpdateVendorData) {
		// Type-safe vendor updates
		return await this.vendorService.updateVendor(id, data);
	}
}
```

### Validation Schemas

Use schemas for runtime validation:

```typescript
import { CreateVendorSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { SchemaValidatorPipe } from '@app/validation';

@Controller('vendor')
export class VendorController {
	@Post()
	@UsePipes(new SchemaValidatorPipe(CreateVendorSchema))
	async createVendor(@Body() data: CreateVendorData) {
		// Data is validated against the schema
		return await this.vendorService.createVendor(data);
	}
}
```

### Real-world Examples

Here's how the apitypes library is used in the actual codebase:

```typescript
// Gateway vendor controller
import { AuthedRequest } from '@app/apitypes/lib/helpers';
import { CreateVendorSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { CreateVendorData, UpdateVendorData } from '@app/apitypes/lib/vendor/vendor.types';

@Controller('vendor')
export class VendorController {
	@Post()
	@UsePipes(new SchemaValidatorPipe(CreateVendorSchema))
	async createVendor(@Body() data: CreateVendorData, @Req() req: AuthedRequest) {
		return await this.vendorClient.createVendor(data);
	}
}
```

```typescript
// User service clerk controller
import { GrpcClerkUserDataSchema } from '@app/apitypes/lib/user/user.schemas';

@Controller()
export class ClerkController {
	@Post('handleUserCreated')
	@UsePipes(new SchemaValidatorPipe(GrpcClerkUserDataSchema))
	async handleUserCreated(@Body() data: any) {
		// Process validated clerk user data
		return { success: true };
	}
}
```

## Benefits

- **Type Safety**: Compile-time checking of data structures
- **Consistency**: Shared definitions prevent drift between services
- **Documentation**: Types serve as living documentation
- **Validation**: Runtime validation ensures data integrity
- **Refactoring Safety**: Changes are caught at compile time

## Structure

```
libs/apitypes/src/lib/
├── helpers.ts                    # Common utility types
├── location/
│   ├── location.schemas.ts      # Location validation schemas
│   └── location.types.ts        # Location type definitions
├── subscription/
│   └── subscription.types.ts    # Subscription type definitions
├── user/
│   └── user.schemas.ts          # User validation schemas
└── vendor/
    ├── vendor.schemas.ts        # Vendor validation schemas
    └── vendor.types.ts          # Vendor type definitions
```
