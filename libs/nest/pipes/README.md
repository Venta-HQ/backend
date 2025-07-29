# Validation Pipes

This directory contains NestJS pipes for request validation and transformation.

## Available Pipes

### Schema Validator Pipe

A unified schema-based validation pipe that works across all transport protocols:

- **SchemaValidatorPipe** - Universal schema validation for HTTP, gRPC, and WebSocket requests

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

- **Multi-Protocol Support**: Single implementation works for HTTP, gRPC, and WebSocket requests
- **Schema-Based Validation**: Uses Zod schemas for type-safe validation
- **Automatic Error Handling**: Provides clear validation error messages
- **Performance Optimized**: Efficient validation with minimal overhead
- **Protocol Agnostic**: Handles different metadata types automatically
