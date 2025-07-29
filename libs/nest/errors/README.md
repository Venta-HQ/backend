# Error Handling System

A comprehensive error handling system that provides standardized error types, codes, and multi-protocol error conversion for HTTP, gRPC, and WebSocket applications.

## Features

- **Standardized Error Types**: Predefined error categories with consistent structure
- **Multi-Protocol Support**: Automatic conversion to HTTP, gRPC, and WebSocket exceptions
- **Error Codes**: Centralized error code management with message interpolation
- **Structured Error Details**: Rich error information with timestamps and request tracking
- **Global Error Module**: Automatic exception filtering and error handling

## Usage

### Creating Errors

```typescript
import { AppError, ErrorCodes } from '@app/nest/errors';

// Validation errors
throw AppError.validation(ErrorCodes.VALIDATION_ERROR, {
	field: 'email',
	value: 'invalid-email',
});

// Authentication errors
throw AppError.authentication(ErrorCodes.UNAUTHORIZED);

// Not found errors
throw AppError.notFound(ErrorCodes.USER_NOT_FOUND, {
	userId: '123',
});

// Internal errors
throw AppError.internal(ErrorCodes.DATABASE_ERROR, {
	operation: 'createUser',
	table: 'users',
});
```

### Error Types

```typescript
enum ErrorType {
	AUTHENTICATION = 'AUTHENTICATION',
	AUTHORIZATION = 'AUTHORIZATION',
	CONFLICT = 'CONFLICT',
	EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
	INTERNAL = 'INTERNAL',
	NOT_FOUND = 'NOT_FOUND',
	RATE_LIMIT = 'RATE_LIMIT',
	VALIDATION = 'VALIDATION',
}
```

## Error Structure

### ErrorDetails Interface

```typescript
interface ErrorDetails {
	code: string; // Error code (e.g., 'VALIDATION_ERROR')
	details?: Record<string, any>; // Additional error context
	message: string; // Human-readable message
	path?: string; // Request path
	requestId?: string; // Request identifier
	timestamp: string; // ISO timestamp
	type: ErrorType; // Error category
}
```

### Error Response Format

```json
{
	"error": {
		"code": "VALIDATION_ERROR",
		"details": {
			"field": "email",
			"value": "invalid-email"
		},
		"message": "Invalid email format",
		"path": "/api/users",
		"requestId": "req-123",
		"timestamp": "2024-01-15T10:30:00.000Z",
		"type": "VALIDATION"
	}
}
```

## Multi-Protocol Support

### HTTP Exceptions

```typescript
const error = AppError.notFound(ErrorCodes.USER_NOT_FOUND);
const httpException = error.toHttpException();
// Returns HttpException with 404 status
```

### gRPC Exceptions

```typescript
const error = AppError.validation(ErrorCodes.VALIDATION_ERROR);
const grpcException = error.toGrpcException();
// Returns RpcException with appropriate gRPC status
```

### WebSocket Exceptions

```typescript
const error = AppError.authentication(ErrorCodes.UNAUTHORIZED);
const wsException = error.toWsException();
// Returns WsException for WebSocket connections
```

## Error Codes

### Predefined Error Codes

```typescript
export const ErrorCodes = {
	// Validation errors
	VALIDATION_ERROR: 'VALIDATION_ERROR',
	INVALID_INPUT: 'INVALID_INPUT',

	// Authentication errors
	UNAUTHORIZED: 'UNAUTHORIZED',
	INVALID_TOKEN: 'INVALID_TOKEN',

	// Authorization errors
	FORBIDDEN: 'FORBIDDEN',
	INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

	// Not found errors
	USER_NOT_FOUND: 'USER_NOT_FOUND',
	RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

	// Conflict errors
	DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
	CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION',

	// Rate limiting
	RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

	// Internal errors
	DATABASE_ERROR: 'DATABASE_ERROR',
	INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',

	// External service errors
	EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
	EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;
```

### Message Interpolation

```typescript
// Error codes with placeholders
const ErrorCodes = {
	USER_NOT_FOUND: 'USER_NOT_FOUND',
	FIELD_REQUIRED: 'FIELD_REQUIRED_{field}',
} as const;

// Usage with interpolation
throw AppError.notFound(interpolateMessage(ErrorCodes.FIELD_REQUIRED, { field: 'email' }));
```

## Global Error Handling

### ErrorHandlingModule

The module automatically provides global exception filtering:

```typescript
import { ErrorHandlingModule } from '@app/nest/errors';

@Module({
	imports: [ErrorHandlingModule],
})
export class AppModule {}
```

### Exception Filter

The `AppExceptionFilter` automatically:

- Catches all exceptions
- Converts them to appropriate protocol exceptions
- Provides consistent error formatting
- Includes request context and tracing

## Testing

See `error.test.ts` for comprehensive test coverage including:

- Error creation and conversion
- Multi-protocol exception handling
- Error code interpolation
- Message formatting
- Exception filter behavior

## Dependencies

- `@nestjs/common` - HTTP exceptions
- `@nestjs/microservices` - gRPC exceptions
- `@nestjs/websockets` - WebSocket exceptions
- `@grpc/grpc-js` - gRPC status codes
