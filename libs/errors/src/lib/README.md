# Exception Filter

A global exception filter that provides consistent error handling across HTTP, gRPC, and WebSocket protocols with automatic error conversion and request context enrichment.

## Features

- **Multi-Protocol Support**: Handles HTTP, gRPC, and WebSocket exceptions
- **Automatic Error Conversion**: Converts various error types to standardized AppError format
- **Request Context Enrichment**: Automatically adds request path and ID to errors
- **Consistent Error Format**: Ensures all errors follow the same structure
- **Global Exception Handling**: Catches and processes all unhandled exceptions

## Usage

### Global Registration

The filter is automatically registered when you import the `ErrorHandlingModule`:

```typescript
import { ErrorHandlingModule } from '@app/nest/errors';

@Module({
	imports: [ErrorHandlingModule],
})
export class AppModule {}
```

### Manual Registration

```typescript
import { AppExceptionFilter } from '@app/nest/filters';

@Module({
	providers: [
		{
			provide: APP_FILTER,
			useClass: AppExceptionFilter,
		},
	],
})
export class AppModule {}
```

## Error Conversion

### Supported Error Types

The filter automatically converts these error types to `AppError`:

- **AppError**: Already standardized, passed through unchanged
- **HttpException**: Converted to internal error with status code
- **RpcException**: Converted to internal error with gRPC details
- **WsException**: Converted to internal error with WebSocket details
- **Error**: Generic errors converted to internal errors
- **Unknown**: Unknown errors converted to generic internal errors

### Conversion Examples

```typescript
// HTTP Exception
throw new HttpException('Not found', 404);
// Converts to: AppError.internal('Not found', { statusCode: 404 })

// gRPC Exception
throw new RpcException({ code: 5, message: 'Not found' });
// Converts to: AppError.internal('gRPC error', { code: 5 })

// Generic Error
throw new Error('Something went wrong');
// Converts to: AppError.internal('Something went wrong', { stack: '...' })
```

## Protocol-Specific Handling

### HTTP Requests

```typescript
// Automatically adds request context
error.path = request.url;
error.requestId = request.headers['x-request-id'];

// Returns structured JSON response
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Something went wrong",
    "path": "/api/users",
    "requestId": "req-123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "type": "INTERNAL"
  }
}
```

### gRPC Requests

```typescript
// Adds gRPC context information
error.requestId = context.get('request-id');

// Throws RpcException for gRPC framework handling
throw error.toGrpcException();
```

### WebSocket Messages

```typescript
// Adds WebSocket context information
error.requestId = client.id;

// Emits error to WebSocket client
client.emit('error', error.toWsException());
```

## Request Context Enrichment

The filter automatically enriches errors with:

- **Request Path**: URL path for HTTP requests
- **Request ID**: Unique request identifier for tracing
- **Timestamp**: Error occurrence time
- **Protocol**: Request protocol type

## Error Flow

1. **Exception Occurs**: Any unhandled exception in your application
2. **Filter Catches**: `AppExceptionFilter` catches the exception
3. **Error Conversion**: Converts to standardized `AppError` format
4. **Context Enrichment**: Adds request context and metadata
5. **Protocol Handling**: Routes to appropriate protocol handler
6. **Response Formatting**: Returns consistent error response

## Testing

See `exception.filter.test.ts` for comprehensive test coverage including:

- HTTP exception handling
- gRPC exception handling
- WebSocket exception handling
- Error conversion scenarios
- Request context enrichment
- Response formatting

## Dependencies

- `@nestjs/common` - HTTP exceptions and filters
- `@nestjs/microservices` - gRPC exceptions
- `@nestjs/websockets` - WebSocket exceptions
- `express` - HTTP request/response types
