# gRPC Exception Filter

## Purpose

The gRPC Exception Filter provides centralized error handling for gRPC requests in the Venta backend system. It catches exceptions, transforms them into appropriate gRPC error responses, and ensures consistent error formatting across all gRPC services.

## What It Contains

- **GrpcExceptionFilter**: Main exception filter for gRPC requests
- **Error Transformation**: Converts exceptions to gRPC error codes
- **Response Formatting**: Consistent gRPC error response structure

## Usage

This filter is used to handle exceptions in gRPC controllers and provide consistent error responses.

### Basic Usage
```typescript
// Import the gRPC exception filter
import { GrpcExceptionFilter } from '@app/nest/filters/grpc-exception';

@Controller()
export class UserController {
  @UseFilters(GrpcExceptionFilter)
  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    return this.userService.getUser(request.id);
  }
}
```

### Global Application
```typescript
// Apply gRPC exception filter globally
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GrpcExceptionFilter } from '@app/nest/filters/grpc-exception';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### Controller-Level Application
```typescript
// Apply to specific controller
import { GrpcExceptionFilter } from '@app/nest/filters/grpc-exception';

@Controller()
@UseFilters(GrpcExceptionFilter)
export class UserController {
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    return this.userService.createUser(request);
  }

  async updateUser(request: UpdateUserRequest): Promise<UpdateUserResponse> {
    return this.userService.updateUser(request);
  }
}
```

### Method-Level Application
```typescript
// Apply to specific methods
import { GrpcExceptionFilter } from '@app/nest/filters/grpc-exception';

@Controller()
export class UserController {
  @UseFilters(GrpcExceptionFilter)
  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    return this.userService.getUser(request.id);
  }

  @UseFilters(GrpcExceptionFilter)
  async deleteUser(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    return this.userService.deleteUser(request.id);
  }
}
```

### Custom Error Handling
```typescript
// Custom error handling with gRPC exception filter
import { GrpcExceptionFilter } from '@app/nest/filters/grpc-exception';
import { AppError, ErrorCodes } from '@app/nest/errors';

@Controller()
@UseFilters(GrpcExceptionFilter)
export class UserController {
  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    const user = await this.userService.getUser(request.id);
    
    if (!user) {
      throw new AppError('User not found', ErrorCodes.NOT_FOUND);
    }
    
    return { user };
  }

  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    // Validation errors will be caught and formatted by the filter
    const user = await this.userService.createUser(request);
    return { user };
  }
}
```

### Error Response Format
```typescript
// Example gRPC error responses from the filter
// 5 NOT_FOUND
{
  "code": 5,
  "message": "User not found",
  "details": "User with ID 123 not found"
}

// 3 INVALID_ARGUMENT
{
  "code": 3,
  "message": "Invalid request data",
  "details": "Email field is required"
}

// 13 INTERNAL
{
  "code": 13,
  "message": "Internal server error",
  "details": "Database connection failed"
}
```

### Custom Exception Filter
```typescript
// Extend gRPC exception filter for custom logic
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { GrpcExceptionFilter } from '@app/nest/filters/grpc-exception';

@Catch()
export class CustomGrpcExceptionFilter extends GrpcExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToRpc();
    const data = ctx.getData();

    // Add custom logging
    console.log(`gRPC Exception occurred: ${exception}`);
    console.log(`Request data: ${JSON.stringify(data)}`);

    // Call parent implementation
    super.catch(exception, host);
  }
}

// Usage
@Controller()
@UseFilters(CustomGrpcExceptionFilter)
export class UserController {
  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    return this.userService.getUser(request.id);
  }
}
```

## Key Benefits

- **Consistency**: Uniform error response format across all gRPC services
- **Centralization**: Single place to handle all gRPC exceptions
- **Debugging**: Structured error information for easier troubleshooting
- **gRPC Compliance**: Proper gRPC error codes and response format

## Dependencies

- NestJS framework
- gRPC for service communication
- TypeScript for type definitions 