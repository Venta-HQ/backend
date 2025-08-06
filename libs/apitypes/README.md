# API Types Library

## Purpose

The API Types library provides centralized type definitions, schemas, and validation rules for the entire Venta backend system. It serves as the single source of truth for all data structures used across microservices, ensuring type safety, consistent validation, and maintainable data contracts.

## Overview

This library provides:
- TypeScript interfaces and types for all API data structures
- Zod validation schemas for request/response validation
- Shared constants and enums used across services
- Helper functions for data transformation and validation
- Event type definitions for inter-service communication
- Consistent data contracts across all microservices

## Usage

### Type Imports

Import types and schemas in your services:

```typescript
import { 
  UserCreateRequest, 
  UserResponse, 
  userCreateSchema,
  VendorData,
  vendorSchema,
  LocationUpdate,
  locationUpdateSchema
} from '@app/apitypes';

@Injectable()
export class YourService {
  async createUser(data: UserCreateRequest): Promise<UserResponse> {
    // Validate input data
    const validatedData = userCreateSchema.parse(data);
    
    // Process with type safety
    const user = await this.processUserCreation(validatedData);
    
    return user;
  }

  async updateLocation(locationData: LocationUpdate) {
    // Validate location data
    const validatedLocation = locationUpdateSchema.parse(locationData);
    
    // Process with type safety
    return await this.locationService.update(validatedLocation);
  }
}
```

### Request Validation

Use schemas for request validation in controllers:

```typescript
import { 
  userCreateSchema, 
  vendorUpdateSchema,
  locationUpdateSchema 
} from '@app/apitypes';

@Controller('users')
export class UserController {
  @Post()
  @UsePipes(new SchemaValidatorPipe(userCreateSchema))
  async createUser(@Body() data: UserCreateRequest) {
    return this.userService.createUser(data);
  }
}

@Controller('vendors')
export class VendorController {
  @Put(':id')
  @UsePipes(new SchemaValidatorPipe(vendorUpdateSchema))
  async updateVendor(@Param('id') id: string, @Body() data: VendorUpdateRequest) {
    return this.vendorService.updateVendor(id, data);
  }
}
```

### Event Types

Use event types for inter-service communication:

```typescript
import { 
  UserCreatedEvent,
  VendorUpdatedEvent,
  LocationChangedEvent
} from '@app/apitypes';

@Injectable()
export class EventHandlerService {
  async handleUserCreated(event: UserCreatedEvent) {
    // Type-safe event handling
    const { userId, email, timestamp } = event;
    await this.processUserCreation(userId, email, timestamp);
  }

  async handleVendorUpdated(event: VendorUpdatedEvent) {
    // Type-safe vendor update handling
    const { vendorId, changes, timestamp } = event;
    await this.processVendorUpdate(vendorId, changes, timestamp);
  }
}
```

### Data Transformation

Use helper functions for data transformation:

```typescript
import { 
  transformUserData,
  transformVendorData,
  validateLocationData
} from '@app/apitypes';

@Injectable()
export class DataService {
  async processUserData(rawData: any) {
    // Transform and validate user data
    const transformedData = transformUserData(rawData);
    return await this.userRepository.create(transformedData);
  }

  async processVendorData(rawData: any) {
    // Transform and validate vendor data
    const transformedData = transformVendorData(rawData);
    return await this.vendorRepository.create(transformedData);
  }
}
```

### Constants and Enums

Use shared constants and enums:

```typescript
import { 
  UserStatus,
  VendorCategory,
  LocationType,
  ErrorCodes
} from '@app/apitypes';

@Injectable()
export class ValidationService {
  validateUserStatus(status: UserStatus) {
    return Object.values(UserStatus).includes(status);
  }

  validateVendorCategory(category: VendorCategory) {
    return Object.values(VendorCategory).includes(category);
  }

  throwNotFoundError(resourceType: string, id: string) {
    throw new AppError(
      `${resourceType} not found`, 
      ErrorCodes.RESOURCE_NOT_FOUND,
      { resourceId: id }
    );
  }
}
```

## Key Benefits

- **Type Safety**: Ensures consistent data structures across all services
- **Validation**: Centralized validation rules prevent data inconsistencies
- **Maintainability**: Single place to update data structures and schemas
- **Documentation**: Self-documenting through TypeScript types and interfaces
- **Consistency**: Uniform data contracts across all microservices
- **Error Prevention**: Compile-time and runtime validation catch errors early

## Dependencies

- **Zod** for schema validation and runtime type checking
- **TypeScript** for type definitions and compile-time type safety 