# Error Handling Library

## Purpose

The Error Handling library provides centralized error management for the Venta backend system. It defines standardized error types, error codes, and exception filters that ensure consistent error handling across all microservices and transport layers (HTTP, gRPC, WebSocket).

## What It Contains

- **AppError**: Base error class with standardized error structure
- **Error Codes**: Centralized error code definitions and messages
- **Exception Filters**: Transport-specific exception handling
- **Error Types**: Specialized error classes for different scenarios

## Usage

This library is imported by all microservices and the gateway to ensure consistent error handling and response formatting.

### For Services
```typescript
// Import error handling utilities
import { AppError, ErrorCodes } from '@app/nest/errors';

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
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw new AppError('User already exists', ErrorCodes.CONFLICT);
    }
    
    // Validate required fields
    if (!data.email || !data.name) {
      throw new AppError('Email and name are required', ErrorCodes.BAD_REQUEST);
    }
    
    return this.prisma.user.create({ data });
  }

  async updateUser(id: string, data: UpdateUserRequest) {
    const user = await this.getUser(id);
    
    if (data.email && data.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (emailExists) {
        throw new AppError('Email already in use', ErrorCodes.CONFLICT);
      }
    }
    
    return this.prisma.user.update({ where: { id }, data });
  }
}
```

### For Controllers
```typescript
// Use exception filters for automatic error handling
import { 
  AppExceptionFilter, 
  AppError, 
  ErrorCodes 
} from '@app/nest/errors';

@Controller('users')
@UseFilters(AppExceptionFilter)
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Post()
  async createUser(@Body() data: CreateUserRequest) {
    return this.userService.createUser(data);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() data: UpdateUserRequest) {
    return this.userService.updateUser(id, data);
  }
}
```

### For Custom Error Types
```typescript
// Create custom error types for specific scenarios
import { AppError, ErrorCodes } from '@app/nest/errors';

// Custom validation error
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, ErrorCodes.BAD_REQUEST, { field });
  }
}

// Custom authentication error
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCodes.UNAUTHORIZED);
  }
}

// Custom authorization error
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorCodes.FORBIDDEN);
  }
}

// Usage in services
@Injectable()
export class AuthService {
  async validateToken(token: string) {
    if (!token) {
      throw new AuthenticationError('Token is required');
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }

  async checkPermission(userId: string, resource: string) {
    const user = await this.getUser(userId);
    
    if (!user.permissions.includes(resource)) {
      throw new AuthorizationError(`Access denied to ${resource}`);
    }
  }
}
```

### For Error Codes
```typescript
// Use predefined error codes for consistency
import { ErrorCodes } from '@app/nest/errors';

// Common error scenarios
const errors = {
  // Client errors (4xx)
  BAD_REQUEST: ErrorCodes.BAD_REQUEST,           // 400
  UNAUTHORIZED: ErrorCodes.UNAUTHORIZED,         // 401
  FORBIDDEN: ErrorCodes.FORBIDDEN,               // 403
  NOT_FOUND: ErrorCodes.NOT_FOUND,               // 404
  CONFLICT: ErrorCodes.CONFLICT,                 // 409
  UNPROCESSABLE_ENTITY: ErrorCodes.UNPROCESSABLE_ENTITY, // 422
  
  // Server errors (5xx)
  INTERNAL_SERVER_ERROR: ErrorCodes.INTERNAL_SERVER_ERROR, // 500
  SERVICE_UNAVAILABLE: ErrorCodes.SERVICE_UNAVAILABLE,     // 503
};

// Usage example
if (!user) {
  throw new AppError('User not found', errors.NOT_FOUND);
}

if (!user.isActive) {
  throw new AppError('User account is inactive', errors.FORBIDDEN);
}
```

## Key Benefits

- **Consistency**: Uniform error handling across all services
- **Standardization**: Centralized error codes and messages
- **Maintainability**: Single place to update error handling logic
- **Debugging**: Structured error information for easier troubleshooting

## Dependencies

- NestJS framework
- TypeScript for type definitions 