# Schema Validator Pipe

## Purpose

The Schema Validator Pipe provides Zod-based validation for both HTTP and WebSocket protocols in the Venta backend system. It validates incoming data against predefined schemas and ensures data integrity across all endpoints with structured error handling and type safety.

## Overview

This pipe provides:

- Zod-based data validation for **both HTTP and WebSocket**
- Structured validation error responses (`AppError` for HTTP, `WsException` for WebSocket)
- TypeScript integration with Zod schemas
- Parameter and query validation
- Global and endpoint-specific validation
- Custom error handling for validation failures
- Request data sanitization and transformation

## Usage

### HTTP Validation (Default)

Apply schema validation to HTTP controller endpoints:

```typescript
import { userCreateSchema } from '@venta/domains/marketplace/contracts/types';
import { SchemaValidatorPipe } from '@venta/nest/pipes/schema-validator';

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

### WebSocket Validation (Auto-Detection)

Apply schema validation to WebSocket message handlers - **no configuration needed!**

The pipe automatically detects WebSocket contexts and throws `WsException` instead of `AppError`.

```typescript
import { userLocationUpdateSchema } from '@venta/domains/location-services/contracts';
import { SchemaValidatorPipe } from '@venta/nest/pipes/schema-validator';

@WebSocketGateway({ namespace: 'user' })
export class UserLocationGateway {
	@SubscribeMessage('update_location')
	@UsePipes(new SchemaValidatorPipe(userLocationUpdateSchema)) // Auto-detects WebSocket context!
	async handleLocationUpdate(
		@MessageBody() data: UserLocationUpdateRequest, // Automatically validated and typed
		@ConnectedSocket() socket: AuthenticatedSocket,
	) {
		// Data is automatically validated before reaching this method
		// Pipe automatically throws WsException for WebSocket handlers
		return this.locationService.updateLocation(data);
	}
}
```

**Auto-Detection Logic:**

- **WebSocket decorators** (`@MessageBody()`, `@ConnectedSocket()`) use `metadata.type === 'custom'`
- **HTTP decorators** (`@Body()`, `@Query()`, `@Param()`) use specific types like `'body'`, `'query'`, `'param'`
- This leverages NestJS's built-in decorator metadata patterns for reliable detection

### Multiple Schema Validation

Use different schemas for different operations:

```typescript
import { userCreateSchema, userLoginSchema, userUpdateSchema } from '@venta/domains/marketplace/contracts/types';
import { SchemaValidatorPipe } from '@venta/nest/pipes/schema-validator';

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
import { SchemaValidatorPipe } from '@venta/nest/pipes/schema-validator';

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
import { SchemaValidatorPipe } from '@venta/nest/pipes/schema-validator';

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
import { AppError, ErrorCodes } from '@venta/nest/errors';
import { SchemaValidatorPipe } from '@venta/nest/pipes/schema-validator';

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
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { SchemaValidatorPipe } from '@venta/nest/pipes/schema-validator';

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
