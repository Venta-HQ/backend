# Validation Pipes

This directory contains NestJS pipes for request validation and transformation.

## Available Pipes

### Schema Validator Pipes

Schema-based validation pipes for different transport protocols:

- **SchemaValidatorPipe** - General schema validation for HTTP requests
- **GrpcSchemaValidatorPipe** - Schema validation for gRPC requests
- **WsSchemaValidatorPipe** - Schema validation for WebSocket messages

## Usage

```typescript
import { SchemaValidatorPipe } from '@libs/nest/pipes';

@Controller('api')
export class ApiController {
	@Post()
	@UsePipes(new SchemaValidatorPipe(validationSchema))
	createResource(@Body() data: any) {
		// Validated data
	}
}
```

## Features

- **Multi-Protocol Support**: Validation for HTTP, gRPC, and WebSocket requests
- **Schema-Based Validation**: Uses Zod schemas for type-safe validation
- **Automatic Error Handling**: Provides clear validation error messages
- **Performance Optimized**: Efficient validation with minimal overhead
