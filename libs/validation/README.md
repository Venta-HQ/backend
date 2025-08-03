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
import { CreateVendorSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { SchemaValidatorPipe } from '@app/validation';
import { Body, Controller, Post, UsePipes } from '@nestjs/common';

@Controller('vendor')
export class VendorController {
	@Post()
	@UsePipes(new SchemaValidatorPipe(CreateVendorSchema))
	async createVendor(@Body() userData: CreateVendorInput) {
		// userData is now validated and typed
		return await this.vendorService.createVendor(userData);
	}
}
```

### gRPC Validation

Validate gRPC requests using the same validation pipes:

```typescript
import { GrpcVendorCreateDataSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { SchemaValidatorPipe } from '@app/validation';

@Controller()
export class VendorController {
	@Post('createVendor')
	@UsePipes(new SchemaValidatorPipe(GrpcVendorCreateDataSchema))
	async createVendor(@Body() data: any) {
		// Data is validated against the schema
		return await this.vendorService.createVendor(data);
	}
}
```

### WebSocket Validation

Validate WebSocket messages:

```typescript
import { VendorLocationUpdateDataSchema } from '@app/apitypes/lib/location/location.schemas';
import { SchemaValidatorPipe } from '@app/validation';
import { MessageBody } from '@nestjs/websockets';

@WebSocketGateway()
export class LocationGateway {
	@SubscribeMessage('updateVendorLocation')
	async updateVendorLocation(
		@MessageBody(new SchemaValidatorPipe(VendorLocationUpdateDataSchema))
		data: VendorLocationUpdateData,
	) {
		// Data is validated before processing
		return await this.locationService.updateVendorLocation(data);
	}
}
```

### Schema Definition

Define validation schemas for your data structures and API endpoints.

```typescript
import { z } from 'zod';

// Vendor creation schema
export const CreateVendorSchema = z.object({
	name: z.string().min(1, 'Vendor name is required'),
	description: z.string().optional(),
	email: z.string().email('Invalid email format').optional(),
	phone: z.string().optional(),
});

// Vendor update schema
export const UpdateVendorSchema = z.object({
	name: z.string().min(1, 'Vendor name is required').optional(),
	description: z.string().optional(),
	email: z.string().email('Invalid email format').optional(),
	phone: z.string().optional(),
});

// Type inference
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;
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

### Real-world Examples

Here's how validation is used in the actual codebase:

```typescript
// Gateway vendor controller
import { CreateVendorSchema } from '@app/apitypes/lib/vendor/vendor.schemas';
import { SchemaValidatorPipe } from '@app/validation';

@Controller('vendor')
export class VendorController {
	@Post()
	@UsePipes(new SchemaValidatorPipe(CreateVendorSchema))
	async createVendor(@Body() data: CreateVendorData) {
		return await this.vendorClient.createVendor(data);
	}
}
```

```typescript
// User service clerk controller
import { GrpcClerkUserDataSchema } from '@app/apitypes/lib/user/user.schemas';
import { SchemaValidatorPipe } from '@app/validation';

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

```typescript
// WebSocket gateway
import { VendorLocationUpdateDataSchema } from '@app/apitypes/lib/location/location.schemas';
import { SchemaValidatorPipe } from '@app/validation';

@WebSocketGateway()
export class LocationGateway {
	@SubscribeMessage('updateVendorLocation')
	async updateVendorLocation(
		@MessageBody(new SchemaValidatorPipe(VendorLocationUpdateDataSchema))
		data: VendorLocationUpdateData,
	) {
		return await this.locationService.updateVendorLocation(data);
	}
}
```

## Dependencies

- Zod for schema validation
- NestJS for framework integration
