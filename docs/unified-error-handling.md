# 🚨 Unified Error Handling System

## 📋 Table of Contents

- [Overview](#overview)
- [Error Types](#error-types)
- [Error Codes](#error-codes)
- [Usage Patterns](#usage-patterns)
- [Automatic Domain Context](#automatic-domain-context)
- [Error Response Format](#error-response-format)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## 🎯 Overview

The unified error handling system provides a consistent approach to error management across all services in the Venta backend. It automatically adds domain context to all errors and provides a standardized error response format.

### **Key Features**

- **Unified Error Class**: Single `AppError` class for all errors
- **Automatic Domain Context**: Domain information automatically added to all errors
- **Type Safety**: TypeScript support with proper error types and codes
- **Consistent Format**: Standardized error response format across all protocols
- **Rich Context**: Detailed error context for debugging and monitoring

## 🔧 Error Types

The system defines four main error types:

```typescript
enum ErrorType {
  VALIDATION = 'VALIDATION',           // Input validation errors
  NOT_FOUND = 'NOT_FOUND',             // Resource not found
  INTERNAL = 'INTERNAL',               // Internal server errors
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE', // External service failures
}
```

### **Error Type Usage**

#### **VALIDATION**
Use for input validation errors:
```typescript
throw new AppError(
  ErrorType.VALIDATION,
  ErrorCodes.LOCATION_INVALID_COORDINATES,
  'Invalid coordinates provided',
  { lat: data.lat, long: data.long }
);
```

#### **NOT_FOUND**
Use when resources are not found:
```typescript
throw new AppError(
  ErrorType.NOT_FOUND,
  ErrorCodes.USER_NOT_FOUND,
  'User not found',
  { userId: id }
);
```

#### **INTERNAL**
Use for internal server errors:
```typescript
throw new AppError(
  ErrorType.INTERNAL,
  ErrorCodes.DATABASE_ERROR,
  'Failed to create user',
  { clerkId: data.clerkId, operation: 'create_user' }
);
```

#### **EXTERNAL_SERVICE**
Use for external service failures:
```typescript
throw new AppError(
  ErrorType.EXTERNAL_SERVICE,
  ErrorCodes.LOCATION_REDIS_OPERATION_FAILED,
  'Failed to update location in Redis',
  { vendorId: data.entityId, operation: 'update_location' }
);
```

## 📝 Error Codes

Error codes are consolidated into a single source of truth:

```typescript
export const ErrorCodes = {
  // Generic errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // User domain errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  
  // Vendor domain errors
  VENDOR_NOT_FOUND: 'VENDOR_NOT_FOUND',
  VENDOR_ALREADY_EXISTS: 'VENDOR_ALREADY_EXISTS',
  
  // Location domain errors
  LOCATION_INVALID_COORDINATES: 'LOCATION_INVALID_COORDINATES',
  LOCATION_INVALID_LATITUDE: 'LOCATION_INVALID_LATITUDE',
  LOCATION_INVALID_LONGITUDE: 'LOCATION_INVALID_LONGITUDE',
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  LOCATION_REDIS_OPERATION_FAILED: 'LOCATION_REDIS_OPERATION_FAILED',
  LOCATION_PROXIMITY_SEARCH_FAILED: 'LOCATION_PROXIMITY_SEARCH_FAILED',
  
  // Marketplace domain errors
  MARKETPLACE_OPERATION_FAILED: 'MARKETPLACE_OPERATION_FAILED',
  
  // Communication domain errors
  WEBHOOK_PROCESSING_FAILED: 'WEBHOOK_PROCESSING_FAILED',
  
  // Infrastructure domain errors
  GATEWAY_ROUTING_FAILED: 'GATEWAY_ROUTING_FAILED',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
} as const;
```

## 💡 Usage Patterns

### **Basic Error Throwing**

```typescript
import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';

@Injectable()
export class UserService {
  async getUserById(id: string): Promise<User> {
    const user = await this.prisma.db.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        ErrorCodes.USER_NOT_FOUND,
        'User not found',
        { userId: id }
      );
    }

    return user;
  }
}
```

### **Validation Errors**

```typescript
async validateUserData(data: UserData): Promise<void> {
  if (!data.email) {
    throw new AppError(
      ErrorType.VALIDATION,
      ErrorCodes.VALIDATION_ERROR,
      'Email is required',
      { field: 'email', operation: 'user_validation' }
    );
  }

  if (!isValidEmail(data.email)) {
    throw new AppError(
      ErrorType.VALIDATION,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid email format',
      { field: 'email', value: data.email, operation: 'user_validation' }
    );
  }
}
```

### **Database Errors**

```typescript
async createUser(data: UserData): Promise<User> {
  try {
    const user = await this.prisma.db.user.create({ data });
    return user;
  } catch (error) {
    throw new AppError(
      ErrorType.INTERNAL,
      ErrorCodes.DATABASE_ERROR,
      'Failed to create user',
      {
        clerkId: data.clerkId,
        operation: 'create_user',
        originalError: error.message,
      }
    );
  }
}
```

### **External Service Errors**

```typescript
async updateLocationInRedis(vendorId: string, location: LocationData): Promise<void> {
  try {
    await this.redis.geoadd('vendor_locations', location.long, location.lat, vendorId);
  } catch (error) {
    throw new AppError(
      ErrorType.EXTERNAL_SERVICE,
      ErrorCodes.LOCATION_REDIS_OPERATION_FAILED,
      'Failed to update vendor location in Redis',
      {
        vendorId,
        location,
        operation: 'update_vendor_location',
        originalError: error.message,
      }
    );
  }
}
```

## 🏷️ Automatic Domain Context

All errors automatically receive domain context through the `AppExceptionFilter`:

### **How It Works**

```typescript
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const appError = this.convertToAppError(exception);
    this.addDomainContext(appError); // Automatically adds domain context
    
    return this.formatResponse(appError, host);
  }

  private addDomainContext(error: AppError): void {
    const domain = this.configService.get<string>('DOMAIN');
    if (domain) {
      error.context = { ...error.context, domain };
    }
  }
}
```

### **Domain Configuration**

Each service is configured with its DDD domain:

```typescript
// apps/marketplace/user-management/src/main.ts
await BootstrapService.bootstrapGrpcMicroservice({
  app,
  domain: 'marketplace', // Explicit DDD domain
  appName: APP_NAMES.USER_MANAGEMENT,
});

// apps/location-services/geolocation/src/main.ts
await BootstrapService.bootstrapGrpcMicroservice({
  app,
  domain: 'location-services', // Explicit DDD domain
  appName: APP_NAMES.GEOLOCATION,
});
```

### **Environment Variable**

The domain is automatically set as an environment variable:

```env
# Automatically set by bootstrap
DOMAIN=marketplace
```

## 📄 Error Response Format

### **HTTP Response**

```json
{
  "error": {
    "type": "VALIDATION",
    "code": "LOCATION_INVALID_COORDINATES",
    "message": "Invalid coordinates provided",
    "context": {
      "lat": 91,
      "long": 180,
      "domain": "location-services",
      "operation": "update_vendor_location"
    }
  }
}
```

### **gRPC Response**

```typescript
{
  error: {
    type: 'VALIDATION',
    code: 'LOCATION_INVALID_COORDINATES',
    message: 'Invalid coordinates provided',
    context: {
      lat: 91,
      long: 180,
      domain: 'location-services',
      operation: 'update_vendor_location'
    }
  }
}
```

### **WebSocket Response**

```json
{
  "error": {
    "type": "VALIDATION",
    "code": "LOCATION_INVALID_COORDINATES",
    "message": "Invalid coordinates provided",
    "context": {
      "lat": 91,
      "long": 180,
      "domain": "location-services",
      "operation": "update_vendor_location"
    }
  }
}
```

## ✅ Best Practices

### **1. Use Descriptive Error Messages**

```typescript
// ❌ Bad - Generic message
throw new AppError(ErrorType.VALIDATION, ErrorCodes.VALIDATION_ERROR, 'Invalid input');

// ✅ Good - Descriptive message
throw new AppError(
  ErrorType.VALIDATION,
  ErrorCodes.LOCATION_INVALID_COORDINATES,
  'Latitude must be between -90 and 90 degrees',
  { lat: data.lat, expectedRange: '[-90, 90]' }
);
```

### **2. Include Rich Context**

```typescript
// ❌ Bad - Minimal context
throw new AppError(ErrorType.INTERNAL, ErrorCodes.DATABASE_ERROR, 'Database error');

// ✅ Good - Rich context
throw new AppError(
  ErrorType.INTERNAL,
  ErrorCodes.DATABASE_ERROR,
  'Failed to create user profile',
  {
    clerkId: data.clerkId,
    operation: 'create_user_profile',
    table: 'user_profiles',
    originalError: error.message,
  }
);
```

### **3. Use Appropriate Error Types**

```typescript
// ❌ Bad - Wrong error type
throw new AppError(ErrorType.INTERNAL, ErrorCodes.VALIDATION_ERROR, 'Invalid email');

// ✅ Good - Correct error type
throw new AppError(ErrorType.VALIDATION, ErrorCodes.VALIDATION_ERROR, 'Invalid email format');
```

### **4. Handle Async Errors Properly**

```typescript
// ❌ Bad - Generic error handling
try {
  await this.externalService.call();
} catch (error) {
  throw new Error('Something went wrong');
}

// ✅ Good - Specific error handling
try {
  await this.externalService.call();
} catch (error) {
  throw new AppError(
    ErrorType.EXTERNAL_SERVICE,
    ErrorCodes.EXTERNAL_SERVICE_ERROR,
    'External service call failed',
    {
      service: 'external-api',
      operation: 'data_sync',
      originalError: error.message,
    }
  );
}
```

### **5. Log Errors Before Throwing**

```typescript
// ✅ Good - Log before throwing
try {
  await this.prisma.db.user.create({ data });
} catch (error) {
  this.logger.error('Failed to create user', {
    clerkId: data.clerkId,
    error: error.message,
    operation: 'create_user',
  });
  
  throw new AppError(
    ErrorType.INTERNAL,
    ErrorCodes.DATABASE_ERROR,
    'Failed to create user',
    {
      clerkId: data.clerkId,
      operation: 'create_user',
    }
  );
}
```

## 🔄 Migration Guide

### **From Domain-Specific Errors**

```typescript
// ❌ Old - Domain-specific error classes
throw new UserDomainError(UserDomainErrorCodes.DATABASE_ERROR, 'Failed to create user');

// ✅ New - Unified error handling
throw new AppError(
  ErrorType.INTERNAL,
  ErrorCodes.DATABASE_ERROR,
  'Failed to create user',
  { clerkId: data.clerkId, operation: 'create_user' }
);
```

### **From Generic Errors**

```typescript
// ❌ Old - Generic error handling
throw new Error('User not found');

// ✅ New - Structured error handling
throw new AppError(
  ErrorType.NOT_FOUND,
  ErrorCodes.USER_NOT_FOUND,
  'User not found',
  { userId: id }
);
```

### **From HTTP Status Codes**

```typescript
// ❌ Old - HTTP status-based errors
throw new HttpException('Invalid input', HttpStatus.BAD_REQUEST);

// ✅ New - Type-based errors
throw new AppError(
  ErrorType.VALIDATION,
  ErrorCodes.VALIDATION_ERROR,
  'Invalid input provided',
  { field: 'email', value: invalidEmail }
);
```

### **Step-by-Step Migration**

1. **Update Imports**
   ```typescript
   // Remove old imports
   import { UserDomainError, UserDomainErrorCodes } from '@app/nest/errors';
   
   // Add new imports
   import { AppError, ErrorCodes, ErrorType } from '@app/nest/errors';
   ```

2. **Replace Error Throws**
   ```typescript
   // Replace domain-specific errors with AppError
   throw new AppError(
     ErrorType.INTERNAL,
     ErrorCodes.DATABASE_ERROR,
     'Failed to create user',
     { clerkId: data.clerkId, operation: 'create_user' }
   );
   ```

3. **Update Error Handling**
   ```typescript
   // Update catch blocks to use new error structure
   try {
     // Operation
   } catch (error) {
     if (error instanceof AppError) {
       // Handle AppError
       this.logger.error('AppError occurred', {
         type: error.type,
         code: error.code,
         context: error.context,
       });
     } else {
       // Convert to AppError
       throw new AppError(
         ErrorType.INTERNAL,
         ErrorCodes.INTERNAL_ERROR,
         'Unexpected error occurred',
         { originalError: error.message }
       );
     }
   }
   ```

4. **Update Tests**
   ```typescript
   // Update test expectations
   await expect(service.createUser(data)).rejects.toThrow(AppError);
   
   // Test specific error properties
   await expect(service.createUser(data)).rejects.toMatchObject({
     type: ErrorType.INTERNAL,
     code: ErrorCodes.DATABASE_ERROR,
   });
   ```

## 🔍 Debugging

### **Error Investigation**

1. **Check Domain Context**
   - All errors include domain information
   - Look for `domain` field in error logs

2. **Error Type Analysis**
   - Use error type to understand the nature of the error
   - Different types require different handling strategies

3. **Context Information**
   - Rich context provides debugging information
   - Use context to understand the error scenario

### **Log Analysis**

```bash
# Filter errors by domain
docker-compose logs -f service-name | grep "domain=marketplace"

# Filter by error type
docker-compose logs -f service-name | grep "type=VALIDATION"

# Filter by error code
docker-compose logs -f service-name | grep "code=DATABASE_ERROR"
```

---

**The unified error handling system provides a consistent, maintainable, and debuggable approach to error management across all services in the Venta backend.** 