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

### User Types

Types and schemas for user management and authentication.

### Vendor Types

Types and schemas for vendor-related data structures.

### Subscription Types

Types and schemas for subscription and billing data.

## Usage

```typescript
import { LocationTypes, UserSchemas, VendorTypes } from '@libs/apitypes';

// Use types for type safety
const userData: UserTypes.CreateUserRequest = {
	// Type-safe user data
};

// Use schemas for validation
const validatedData = UserSchemas.createUser.parse(userData);
```

## Benefits

- **Type Safety**: Compile-time checking of data structures
- **Consistency**: Shared definitions prevent drift between services
- **Documentation**: Types serve as living documentation
- **Validation**: Runtime validation ensures data integrity
- **Refactoring Safety**: Changes are caught at compile time
