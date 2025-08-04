# HTTP Exception Filter

## Purpose

The HTTP Exception Filter provides centralized error handling for HTTP requests in the Venta backend system. It catches exceptions, transforms them into appropriate HTTP responses, and ensures consistent error formatting across all HTTP endpoints.

## What It Contains

- **HttpExceptionFilter**: Main exception filter for HTTP requests
- **Error Transformation**: Converts exceptions to HTTP responses
- **Response Formatting**: Consistent error response structure

## Usage

This filter is used to handle exceptions in HTTP controllers and provide consistent error responses.

### Basic Usage
```typescript
// Import the HTTP exception filter
import { HttpExceptionFilter } from '@app/nest/filters/http-exception';

@Controller('users')
@UseFilters(HttpExceptionFilter)
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }
}
```

### Global Application
```typescript
// Apply HTTP exception filter globally
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '@app/nest/filters/http-exception';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### Controller-Level Application
```typescript
// Apply to specific controller
import { HttpExceptionFilter } from '@app/nest/filters/http-exception';

@Controller('api')
@UseFilters(HttpExceptionFilter)
export class ApiController {
  @Get('data')
  async getData() {
    return this.service.getData();
  }

  @Post('data')
  async createData(@Body() data: any) {
    return this.service.createData(data);
  }
}
```

### Method-Level Application
```typescript
// Apply to specific methods
import { HttpExceptionFilter } from '@app/nest/filters/http-exception';

@Controller('users')
export class UserController {
  @Get(':id')
  @UseFilters(HttpExceptionFilter)
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  @Post()
  @UseFilters(HttpExceptionFilter)
  async createUser(@Body() data: CreateUserRequest) {
    return this.userService.createUser(data);
  }
}
```

### Custom Error Handling
```typescript
// Custom error handling with HTTP exception filter
import { HttpExceptionFilter } from '@app/nest/filters/http-exception';
import { AppError, ErrorCodes } from '@app/nest/errors';

@Controller('users')
@UseFilters(HttpExceptionFilter)
export class UserController {
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.getUser(id);
    
    if (!user) {
      throw new AppError('User not found', ErrorCodes.NOT_FOUND);
    }
    
    return user;
  }

  @Post()
  async createUser(@Body() data: CreateUserRequest) {
    // Validation errors will be caught and formatted by the filter
    const user = await this.userService.createUser(data);
    return user;
  }
}
```

### Error Response Format
```typescript
// Example error responses from the filter
// 404 Not Found
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/users/123"
}

// 400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/users"
}

// 500 Internal Server Error
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/users"
}
```

### Custom Exception Filter
```typescript
// Extend HTTP exception filter for custom logic
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { HttpExceptionFilter } from '@app/nest/filters/http-exception';

@Catch()
export class CustomHttpExceptionFilter extends HttpExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Add custom logging
    console.log(`Exception occurred: ${exception}`);
    console.log(`Request URL: ${request.url}`);
    console.log(`Request method: ${request.method}`);

    // Call parent implementation
    super.catch(exception, host);
  }
}

// Usage
@Controller('api')
@UseFilters(CustomHttpExceptionFilter)
export class ApiController {
  @Get('data')
  async getData() {
    return this.service.getData();
  }
}
```

## Key Benefits

- **Consistency**: Uniform error response format across all endpoints
- **Centralization**: Single place to handle all HTTP exceptions
- **Debugging**: Structured error information for easier troubleshooting
- **User Experience**: Clear and informative error messages

## Dependencies

- NestJS framework
- Express for HTTP handling
- TypeScript for type definitions 