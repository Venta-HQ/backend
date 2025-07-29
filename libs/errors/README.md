# Errors Library

This library provides standardized error handling and exception management for the Venta backend services.

## Overview

The errors library centralizes error handling across the application, providing consistent error types, error codes, and exception filters. It ensures uniform error responses and proper error logging throughout all services.

## Features

- **Standardized Error Types**: Consistent error classes and structures
- **Error Codes**: Centralized error code management
- **Exception Filters**: Global exception handling and formatting
- **Error Logging**: Structured error logging and monitoring
- **HTTP Error Responses**: Consistent error response formatting

## Usage

### Error Handling

Use the provided error classes to create consistent, typed errors throughout your application.

```typescript
import { AppError, ErrorCodes } from '@app/errors';

@Injectable()
export class UserService {
	async findUser(id: string) {
		const user = await this.prisma.user.findUnique({ where: { id } });

		if (!user) {
			throw AppError.notFound(ErrorCodes.USER_NOT_FOUND, {
				userId: id,
				message: 'User not found',
			});
		}

		return user;
	}

	async validateUser(data: CreateUserInput) {
		if (!data.email) {
			throw AppError.validation(ErrorCodes.INVALID_EMAIL, {
				field: 'email',
				message: 'Email is required',
			});
		}
	}
}
```

### Exception Filter

Apply the global exception filter to automatically format and log errors.

```typescript
import { AppExceptionFilter } from '@app/errors';
import { Module } from '@nestjs/common';

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

### Error Codes

Reference centralized error codes to maintain consistency across the application.

```typescript
import { ErrorCodes } from '@app/errors';

// Use predefined error codes
throw AppError.badRequest(ErrorCodes.INVALID_INPUT);
throw AppError.unauthorized(ErrorCodes.INVALID_TOKEN);
throw AppError.forbidden(ErrorCodes.INSUFFICIENT_PERMISSIONS);
```

## Dependencies

- NestJS for framework integration
- HTTP status codes for response formatting
