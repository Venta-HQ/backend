# @app/nest/validation

This module provides standardized validation tools for the application.

## Features

- Schema-based validation using Zod
- Consistent error handling with `@app/nest/errors`
- Type-safe validation pipes

## Installation

```typescript
import { ValidationModule } from '@app/nest/validation';

@Module({
	imports: [ValidationModule],
})
export class YourModule {}
```

## Usage

### Schema Validator Pipe

The `SchemaValidatorPipe` is a NestJS pipe that validates incoming data against a Zod schema:

```typescript
import { SchemaValidatorPipe } from '@app/nest/validation';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0),
});

@Post()
async createUser(
  @Body(new SchemaValidatorPipe(userSchema)) data: z.infer<typeof userSchema>
) {
  // data is fully typed and validated
}
```

### Error Handling

The validation pipe integrates with `@app/nest/errors` for consistent error handling:

- Uses `AppError.validation()` with proper error codes
- Provides detailed error messages and field paths
- Includes validation context in error objects

Example error:

```json
{
	"code": "INVALID_INPUT",
	"message": "Validation failed for email: Invalid email format",
	"context": {
		"operation": "validate_schema",
		"field": "email",
		"errors": [
			{
				"message": "Invalid email format",
				"path": "email",
				"code": "invalid_string"
			}
		]
	}
}
```

### Best Practices

1. **Schema Organization**:

   - Define schemas in domain-specific `*.schemas.ts` files
   - Use namespaces to organize schemas by domain
   - Export schema types using `z.infer<typeof Schema>`

2. **Validation Strategy**:

   - Use `SchemaValidatorPipe` for HTTP/gRPC endpoint validation
   - Use schema's `safeParse()` for internal validation
   - Add descriptive error messages to schemas

3. **Error Handling**:
   - Let the validation pipe handle error transformation
   - Use `INVALID_INPUT` error code for validation failures
   - Include operation names in validation contexts

### Example

```typescript
// types/user.schemas.ts
export namespace User.Validation {
  export const CreateUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    age: z.number().min(0, 'Age must be positive'),
  });

  export type CreateUserData = z.infer<typeof CreateUserSchema>;
}

// user.controller.ts
@Post()
async createUser(
  @Body(new SchemaValidatorPipe(User.Validation.CreateUserSchema))
  data: User.Validation.CreateUserData
) {
  return this.userService.createUser(data);
}

// user.service.ts
async validateUser(data: unknown): Promise<User.Validation.CreateUserData> {
  const result = User.Validation.CreateUserSchema.safeParse(data);
  if (!result.success) {
    throw AppError.validation('INVALID_INPUT', ErrorCodes.INVALID_INPUT, {
      operation: 'validate_user',
      errors: result.error.errors,
    });
  }
  return result.data;
}
```
