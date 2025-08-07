# Error Handling Library

## Purpose

The Error Handling library provides centralized error management for the Venta backend system. It defines standardized error types, error codes, and exception filters that ensure consistent error handling across all microservices and transport layers (HTTP, gRPC, WebSocket).

## Overview

This library provides:
- Standardized error types and structures
- Centralized error code definitions (single source of truth)
- Transport-specific exception filters
- Consistent error response formatting
- Domain-aware error handling with automatic domain context
- Error handling utilities and helpers

## Usage

### Error Types

Use the base AppError class for consistent error handling:

```typescript
import { AppError, ErrorCodes } from '@app/nest/errors';

// Basic error with message and code
throw new AppError(ErrorType.NOT_FOUND, ErrorCodes.USER_NOT_FOUND, 'User not found');

// Error with additional metadata
throw new AppError(ErrorType.VALIDATION, ErrorCodes.VALIDATION_ERROR, 'Validation failed', {
  field: 'email',
  value: 'invalid-email'
});

// Error with custom context
throw new AppError(ErrorType.EXTERNAL_SERVICE, ErrorCodes.DATABASE_ERROR, 'Database connection failed', {
  service: 'database',
  retryAfter: 30
});
```

### Domain-Aware Error Handling

Use the DomainError class for domain-specific errors with automatic domain context:

```typescript
import { DomainError, ErrorCodes } from '@app/nest/errors';

// Domain error with automatic domain context
throw new DomainError(ErrorCodes.USER_NOT_FOUND, 'User not found');

// Domain error with additional context
throw new DomainError(ErrorCodes.VENDOR_INVALID_LOCATION, 'Invalid vendor location', {
  vendorId: '123',
  coordinates: { lat: 0, lng: 0 }
});

// Domain error with explicit domain (optional)
throw new DomainError(ErrorCodes.LOCATION_REDIS_OPERATION_FAILED, 'Redis operation failed', {
  operation: 'geoadd'
}, 'location-services');
```

The DomainErrorInterceptor automatically appends the DDD domain context to all DomainError instances.

### Error Codes

Use predefined error codes for consistency. All error codes are centralized in a single source of truth:

```typescript
import { ErrorCodes } from '@app/nest/errors';

// Generic/Cross-cutting errors
ErrorCodes.DATABASE_ERROR              // Database operation failed
ErrorCodes.VALIDATION_ERROR            // Validation failed
ErrorCodes.UNAUTHORIZED                // Authentication required
ErrorCodes.INSUFFICIENT_PERMISSIONS    // Insufficient permissions

// User domain errors
ErrorCodes.USER_NOT_FOUND              // User not found
ErrorCodes.USER_ALREADY_EXISTS         // User already exists
ErrorCodes.USER_INVALID_CREDENTIALS    // Invalid user credentials

// Vendor domain errors
ErrorCodes.VENDOR_NOT_FOUND            // Vendor not found
ErrorCodes.VENDOR_ALREADY_EXISTS       // Vendor already exists
ErrorCodes.VENDOR_INVALID_LOCATION     // Invalid vendor location

// Location domain errors
ErrorCodes.LOCATION_NOT_FOUND          // Location not found
ErrorCodes.LOCATION_INVALID_COORDINATES // Invalid coordinates
ErrorCodes.LOCATION_REDIS_OPERATION_FAILED // Redis operation failed

// And many more domain-specific error codes...
```

### Exception Filters

Apply exception filters for automatic error handling:

```typescript
import { AppExceptionFilter } from '@app/nest/errors';

// Controller-level filter
@Controller('users')
@UseFilters(AppExceptionFilter)
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }
}

// Global filter (in main.ts)
app.useGlobalFilters(new AppExceptionFilter());
```

### Custom Error Types

Create custom error types for specific scenarios:

```typescript
import { AppError, ErrorCodes } from '@app/nest/errors';

// Validation error
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, ErrorCodes.BAD_REQUEST, { field });
  }
}

// Authentication error
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCodes.UNAUTHORIZED);
  }
}

// Authorization error
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorCodes.FORBIDDEN);
  }
}

// Business logic error
export class BusinessError extends AppError {
  constructor(message: string, code: string) {
    super(message, code);
  }
}
```

### Service Error Handling

Implement consistent error handling in services:

```typescript
@Injectable()
export class UserService {
  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new AppError('User not found', ErrorCodes.NOT_FOUND);
    }
    
    return user;
  }

  async createUser(data: CreateUserRequest) {
    // Check for existing user
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw new AppError('User already exists', ErrorCodes.CONFLICT);
    }
    
    // Validate required fields
    if (!data.email || !data.name) {
      throw new ValidationError('Email and name are required');
    }
    
    return this.prisma.user.create({ data });
  }
}
```

### Error Response Format

All errors follow a consistent response format:

```typescript
// Error response structure
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found",
    "statusCode": 404,
    "timestamp": "2024-01-01T00:00:00Z",
    "path": "/users/123",
    "metadata": {
      "field": "id",
      "value": "123"
    }
  }
}
```

### Environment Configuration

Configure error handling behavior:

```env
# Error Handling Configuration
ERROR_INCLUDE_STACK_TRACE=false
ERROR_INCLUDE_REQUEST_ID=true
ERROR_LOG_LEVEL=error
ERROR_RESPONSE_FORMAT=standard
```

## Key Benefits

- **Consistency**: Uniform error handling across all services
- **Standardization**: Centralized error codes and messages
- **Maintainability**: Single place to update error handling logic
- **Debugging**: Structured error information for easier troubleshooting
- **Transport Agnostic**: Works across HTTP, gRPC, and WebSocket
- **Type Safety**: TypeScript support for error types and codes

## Dependencies

- **NestJS** for exception filters and framework integration
- **TypeScript** for type definitions 