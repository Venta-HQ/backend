# Error Management

This directory contains standardized error types, codes, and error handling utilities for consistent error management across services.

## Components

### Error Types

Standardized error classes that provide consistent error handling and formatting.

### Error Codes

Predefined error codes that help identify and categorize different types of errors.

### Error Module

NestJS module that provides error handling utilities and services.

## Usage

```typescript
import { CustomError, ErrorCodes, ErrorModule } from '@libs/nest/errors';

@Module({
	imports: [ErrorModule],
})
export class AppModule {}

// In your service
throw new CustomError('User not found', ErrorCodes.USER_NOT_FOUND);
```

## Features

- **Standardized Error Structure**: Consistent error format across all services
- **Error Categorization**: Predefined error codes for easy identification
- **Error Context**: Rich error information for debugging and logging
- **Type Safety**: TypeScript support for error handling
