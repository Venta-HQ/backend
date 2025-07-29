# SchemaValidatorPipe

A NestJS pipe that provides universal schema-based validation using Zod for HTTP, gRPC, and WebSocket requests.

## Features

- **Zod Integration**: Type-safe validation using Zod schemas
- **Multi-Protocol Support**: Works with HTTP, gRPC, and WebSocket requests
- **Structured Error Messages**: Detailed validation error reporting
- **Automatic Error Handling**: Converts validation errors to standardized AppError format
- **Field-Level Validation**: Provides specific field error information

## Usage

```typescript
import { z } from 'zod';
import { SchemaValidatorPipe } from '@app/nest/pipes';

// Define your schema
const CreateUserSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	age: z.number().min(18),
});

@Controller('users')
export class UserController {
	@Post()
	@UsePipes(new SchemaValidatorPipe(CreateUserSchema))
	createUser(@Body() userData: z.infer<typeof CreateUserSchema>) {
		// userData is now validated and typed
		return this.userService.create(userData);
	}

	@Get(':id')
	@UsePipes(new SchemaValidatorPipe(z.string().uuid()))
	getUser(@Param('id') id: string) {
		// id is validated as UUID
		return this.userService.findById(id);
	}
}
```

## Schema Examples

### Object Validation

```typescript
const UserSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().email('Invalid email format'),
	age: z.number().min(18, 'Must be at least 18 years old'),
	preferences: z
		.object({
			theme: z.enum(['light', 'dark']).default('light'),
			notifications: z.boolean().default(true),
		})
		.optional(),
});
```

### Array Validation

```typescript
const OrderSchema = z.object({
	items: z
		.array(
			z.object({
				productId: z.string().uuid(),
				quantity: z.number().positive(),
				price: z.number().positive(),
			}),
		)
		.min(1, 'At least one item is required'),
});
```

### Conditional Validation

```typescript
const PaymentSchema = z.object({
	method: z.enum(['credit_card', 'paypal']),
	creditCard: z
		.object({
			number: z.string().regex(/^\d{16}$/),
			expiry: z.string().regex(/^\d{2}\/\d{2}$/),
			cvv: z.string().regex(/^\d{3,4}$/),
		})
		.optional()
		.refine((data) => {
			if (data.method === 'credit_card' && !data.creditCard) {
				return false;
			}
			return true;
		}, 'Credit card details required for credit card payments'),
});
```

## Error Handling

The pipe automatically converts Zod validation errors to standardized `AppError` format:

```typescript
// Zod error
{
  "errors": [
    {
      "message": "Invalid email format",
      "path": "email"
    },
    {
      "message": "Must be at least 18 years old",
      "path": "age"
    }
  ],
  "field": "email"
}
```

### Error Response Format

```json
{
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Validation failed",
		"details": {
			"errors": [
				{
					"message": "Invalid email format",
					"path": "email"
				}
			],
			"field": "email"
		}
	}
}
```

## Protocol Support

### HTTP Requests

```typescript
@Post()
@UsePipes(new SchemaValidatorPipe(CreateUserSchema))
createUser(@Body() userData: CreateUserDto) {
  // Validation happens automatically
}
```

### gRPC Requests

```typescript
@GrpcMethod('UserService', 'CreateUser')
@UsePipes(new SchemaValidatorPipe(CreateUserSchema))
createUser(data: CreateUserDto) {
  // Validation works the same way
}
```

### WebSocket Messages

```typescript
@SubscribeMessage('createUser')
@UsePipes(new SchemaValidatorPipe(CreateUserSchema))
handleCreateUser(@MessageBody() userData: CreateUserDto) {
  // Validation applies to WebSocket messages too
}
```

## Testing

See `schema-validator.pipe.test.ts` for comprehensive test coverage including:

- Valid data scenarios
- Invalid data scenarios
- Complex schema validation
- Error message formatting
- Multi-protocol support

## Dependencies

- `zod` - Schema validation library
- `@nestjs/common` - NestJS framework
