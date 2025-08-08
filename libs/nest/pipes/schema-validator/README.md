# Schema Validator Pipe

## Purpose

The Schema Validator Pipe provides Zod-based request data validation for the Venta backend system. It validates incoming request data against predefined schemas and ensures data integrity across all endpoints with structured error handling and type safety.

## Overview

This pipe provides:

- Zod-based request data validation
- Structured validation error responses
- TypeScript integration with Zod schemas
- Parameter and query validation
- Global and endpoint-specific validation
- Custom error handling for validation failures
- Request data sanitization and transformation

## Usage

### Basic Validation

Apply schema validation to controller endpoints:

```typescript
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';
import { userCreateSchema } from '@domains/marketplace/contracts/types';

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

### Multiple Schema Validation

Use different schemas for different operations:

```typescript
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';
import { userCreateSchema, userLoginSchema, userUpdateSchema } from '@domains/marketplace/contracts/types';

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

Validate route parameters:

```typescript
import { z } from 'zod';
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';

const idParamSchema = z.object({
	id: z.string().uuid('Invalid user ID format'),
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

Validate query parameters:

```typescript
import { z } from 'zod';
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';

const searchQuerySchema = z.object({
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(10),
	search: z.string().optional(),
	sort: z.enum(['asc', 'desc']).default('asc'),
	filter: z.enum(['all', 'active', 'inactive']).default('all'),
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

Handle validation errors with custom logic:

```typescript
import { AppError, ErrorCodes } from '@app/nest/errors';
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';

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
					details: error.errors,
				});
			}
			throw error;
		}
	}
}
```

### Global Validation

Apply schema validation globally to all endpoints:

```typescript
import { SchemaValidatorPipe } from '@app/nest/pipes/schema-validator';
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

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

### Custom Validation Schemas

Create custom validation schemas:

```typescript
import { z } from 'zod';

// Custom user validation schema
const customUserSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	name: z.string().min(2, 'Name must be at least 2 characters'),
	age: z.number().min(18, 'Must be at least 18 years old').optional(),
});

// Custom pagination schema
const paginationSchema = z.object({
	page: z.coerce.number().positive('Page must be positive'),
	limit: z.coerce.number().min(1).max(100, 'Limit must be between 1 and 100'),
	sortBy: z.string().optional(),
	sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Usage
@Controller('users')
export class UserController {
	@Get()
	@UsePipes(new SchemaValidatorPipe(paginationSchema))
	async getUsers(@Query() query: any) {
		return this.userService.getUsers(query);
	}
}
```

### Validation Error Response

Handle validation error responses:

```typescript
// Validation error response format
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_string"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "code": "too_small"
      }
    ]
  }
}
```

### Environment Configuration

Configure validation behavior:

```env
# Validation Configuration
VALIDATION_STRICT_MODE=true
VALIDATION_ERROR_DETAILS=true
VALIDATION_TRANSFORM_DATA=true
VALIDATION_STRIP_UNKNOWN=true
```

## Key Benefits

- **Data Integrity**: Ensures valid and sanitized input data
- **Type Safety**: Compile-time validation with TypeScript
- **Consistency**: Uniform validation across all endpoints
- **Error Handling**: Structured validation error responses
- **Flexibility**: Support for custom validation schemas
- **Performance**: Efficient validation with Zod
- **Maintainability**: Centralized validation logic

## Dependencies

- **Zod** for schema validation and data transformation
- **NestJS** for pipe framework and dependency injection
- **TypeScript** for type definitions
