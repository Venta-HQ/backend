# Validation Library

This library provides data validation and schema validation utilities for the Venta backend services.

## Overview

The validation library offers comprehensive data validation capabilities using Zod schemas. It provides validation pipes, schema definitions, and type-safe validation for incoming requests and data structures.

## Features

- **Schema Validation**: Validate data against Zod schemas
- **Validation Pipes**: NestJS pipes for automatic request validation
- **Type Safety**: Type-safe validation with TypeScript integration
- **Error Handling**: Structured validation error responses
- **Custom Schemas**: Define and reuse custom validation schemas

## Usage

### Request Validation

Apply validation pipes to automatically validate incoming requests.

```typescript
import { SchemaValidatorPipe } from '@app/validation';
import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { CreateUserSchema } from './schemas/user.schema';

@Controller('users')
export class UserController {
	@Post()
	@UsePipes(new SchemaValidatorPipe(CreateUserSchema))
	async createUser(@Body() userData: CreateUserInput) {
		// userData is now validated and typed
		return await this.userService.createUser(userData);
	}
}
```

### Schema Definition

Define validation schemas for your data structures and API endpoints.

```typescript
import { z } from 'zod';

// User creation schema
export const CreateUserSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	age: z.number().min(18, 'Must be at least 18 years old').optional(),
});

// Product update schema
export const UpdateProductSchema = z.object({
	name: z.string().min(1, 'Product name is required').optional(),
	price: z.number().positive('Price must be positive').optional(),
	category: z.enum(['electronics', 'clothing', 'books']).optional(),
	tags: z.array(z.string()).optional(),
});

// Type inference
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
```

### Error Handling

Handle validation errors with structured error responses.

```typescript
import { SchemaValidatorPipe } from '@app/validation';
import { Body, Controller, HttpException, HttpStatus, Post, UsePipes } from '@nestjs/common';

@Controller('orders')
export class OrderController {
	@Post()
	@UsePipes(new SchemaValidatorPipe(CreateOrderSchema))
	async createOrder(@Body() orderData: CreateOrderInput) {
		try {
			return await this.orderService.createOrder(orderData);
		} catch (error) {
			if (error instanceof z.ZodError) {
				throw new HttpException(
					{
						message: 'Validation failed',
						errors: error.errors.map((err) => ({
							field: err.path.join('.'),
							message: err.message,
						})),
					},
					HttpStatus.BAD_REQUEST,
				);
			}
			throw error;
		}
	}
}
```

## Dependencies

- Zod for schema validation
- NestJS for framework integration
