# Schema Validator Pipe

## Purpose

The Schema Validator Pipe provides Zod-based request data validation for the Venta backend system. It validates incoming request data against predefined schemas and ensures data integrity across all endpoints.

## What It Contains

- **SchemaValidatorPipe**: Main validation pipe using Zod schemas
- **Error Handling**: Structured validation error responses
- **Type Safety**: TypeScript integration with Zod schemas

## Usage

This pipe is used to validate request data in controllers and ensure data integrity.

### Basic Usage
```typescript
// Import the schema validator pipe
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';
import { userCreateSchema } from '@app/apitypes';

@Controller('users')
export class UserController {
  @Post()
  @UsePipes(new SchemaValidatorPipe(userCreateSchema))
  async createUser(@Body() data: CreateUserRequest) {
    // Data is automatically validated before reaching this method
    return this.userService.createUser(data);
  }
}
```

### With Different Schemas
```typescript
// Use different schemas for different operations
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';
import { 
  userCreateSchema, 
  userUpdateSchema,
  userLoginSchema 
} from '@app/apitypes';

@Controller('users')
export class UserController {
  @Post('register')
  @UsePipes(new SchemaValidatorPipe(userCreateSchema))
  async register(@Body() data: CreateUserRequest) {
    return this.userService.createUser(data);
  }

  @Post('login')
  @UsePipes(new SchemaValidatorPipe(userLoginSchema))
  async login(@Body() data: LoginRequest) {
    return this.authService.login(data);
  }

  @Put(':id')
  @UsePipes(new SchemaValidatorPipe(userUpdateSchema))
  async updateUser(@Param('id') id: string, @Body() data: UpdateUserRequest) {
    return this.userService.updateUser(id, data);
  }
}
```

### Parameter Validation
```typescript
// Validate route parameters
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';
import { z } from 'zod';

const idParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});

@Controller('users')
export class UserController {
  @Get(':id')
  @UsePipes(new SchemaValidatorPipe(idParamSchema))
  async getUser(@Param() params: { id: string }) {
    return this.userService.getUser(params.id);
  }

  @Delete(':id')
  @UsePipes(new SchemaValidatorPipe(idParamSchema))
  async deleteUser(@Param() params: { id: string }) {
    return this.userService.deleteUser(params.id);
  }
}
```

### Query Parameter Validation
```typescript
// Validate query parameters
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';
import { z } from 'zod';

const searchQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sort: z.enum(['asc', 'desc']).default('asc'),
  filter: z.enum(['all', 'active', 'inactive']).default('all')
});

@Controller('users')
export class UserController {
  @Get()
  @UsePipes(new SchemaValidatorPipe(searchQuerySchema))
  async getUsers(@Query() query: any) {
    return this.userService.getUsers(query);
  }
}
```

### Custom Error Handling
```typescript
// Custom error handling for validation failures
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';
import { AppError, ErrorCodes } from '@app/nest/errors';

@Controller('users')
export class UserController {
  @Post()
  @UsePipes(new SchemaValidatorPipe(userCreateSchema))
  async createUser(@Body() data: CreateUserRequest) {
    try {
      return await this.userService.createUser(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError('Validation failed', ErrorCodes.BAD_REQUEST, {
          details: error.errors
        });
      }
      throw error;
    }
  }
}
```

### Global Usage
```typescript
// Apply schema validation globally
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: SchemaValidatorPipe,
    },
  ],
})
export class AppModule {}
```

## Key Benefits

- **Data Integrity**: Ensures valid and sanitized input data
- **Type Safety**: Compile-time validation with TypeScript
- **Consistency**: Uniform validation across all endpoints
- **Error Handling**: Structured validation error responses

## Dependencies

- Zod for schema validation
- NestJS framework
- TypeScript for type definitions 