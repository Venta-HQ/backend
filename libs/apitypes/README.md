# API Types Library

## Purpose

The API Types library provides centralized type definitions, schemas, and validation rules for the entire Venta backend system. It serves as the single source of truth for all data structures used across microservices.

## What It Contains

- **Type Definitions**: TypeScript interfaces and types for all API data structures
- **Validation Schemas**: Zod schemas for request/response validation
- **Shared Constants**: Common constants and enums used across services
- **Helper Functions**: Utility functions for data transformation and validation

## Usage

This library is imported by all microservices and the gateway to ensure consistent data structures and validation across the entire system.

### For Services
```typescript
// Import types and schemas
import { 
  UserCreateRequest, 
  UserResponse, 
  userCreateSchema,
  VendorData,
  vendorSchema 
} from '@app/apitypes';

@Injectable()
export class UserService {
  async createUser(data: UserCreateRequest): Promise<UserResponse> {
    // Validate input data
    const validatedData = userCreateSchema.parse(data);
    
    // Process user creation
    const user = await this.processUserCreation(validatedData);
    
    return user;
  }

  async getVendorData(vendorId: string): Promise<VendorData> {
    // Use vendor types for type safety
    const vendor = await this.vendorRepository.findById(vendorId);
    return vendorSchema.parse(vendor);
  }
}
```

### For Gateway
```typescript
// Import schemas for request validation
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

### For Validation
```typescript
// Use schemas for runtime validation
import { userCreateSchema, vendorSchema } from '@app/apitypes';

// Validate user data
const userData = {
  email: 'user@example.com',
  name: 'John Doe',
  age: 25
};

try {
  const validatedUser = userCreateSchema.parse(userData);
  console.log('Valid user data:', validatedUser);
} catch (error) {
  console.error('Validation failed:', error.errors);
}

// Validate vendor data
const vendorData = {
  id: 'vendor-123',
  name: 'Acme Corp',
  description: 'A great vendor'
};

const validatedVendor = vendorSchema.parse(vendorData);
```

## Key Benefits

- **Type Safety**: Ensures consistent data structures across all services
- **Validation**: Centralized validation rules prevent data inconsistencies
- **Maintainability**: Single place to update data structures
- **Documentation**: Self-documenting through TypeScript types

## Dependencies

- Zod for schema validation
- TypeScript for type definitions 