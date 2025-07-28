# Exception Filters

This directory contains NestJS exception filters for standardized error handling across services.

## Available Filters

### ExceptionFilter

Global exception filter that provides consistent error formatting and logging.

**Usage:**

```typescript
import { ExceptionFilter } from '@libs/nest/filters';

@Controller('api')
export class ApiController {
	@Get()
	@UseFilters(ExceptionFilter)
	getData() {
		// Your controller logic
	}
}
```

## Features

- **Standardized Error Format**: Ensures all errors follow a consistent structure
- **Request Context**: Includes request information in error logs
- **Error Logging**: Automatically logs errors with appropriate context
- **Client-Safe Responses**: Returns sanitized error messages to clients

## Error Handling

The exception filter catches various types of errors and transforms them into appropriate HTTP responses while maintaining detailed logging for debugging purposes.
