# Utilities Library

## Purpose

The Utilities library provides common utility functions and helper methods that are used across the Venta backend system. It contains reusable code that doesn't belong to any specific domain but is needed by multiple services.

## What It Contains

- **Retry Logic**: Robust retry mechanisms for handling transient failures in both Promise-based and Observable-based operations
- **Data Transformation**: Helper functions for data manipulation and formatting
- **Validation Utilities**: Common validation and sanitization functions
- **Date/Time Helpers**: Date manipulation and formatting utilities
- **String Utilities**: String processing and formatting functions
- **Math Utilities**: Common mathematical operations and calculations

## Usage

This library is imported by microservices and other libraries when common utility functions are needed.

### For Retry Operations

The library provides two retry utilities for different contexts:

#### `retryOperation` - For Promise-based operations

Use this for async functions that return Promises:

```typescript
import { retryOperation } from '@app/utils';
import { Logger } from '@nestjs/common';

// Retry a database operation with exponential backoff
async function fetchUserData(userId: string) {
	const logger = new Logger('UserService');

	return retryOperation(
		async () => {
			const user = await prisma.user.findUnique({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}
			return user;
		},
		'fetch user data',
		{
			logger,
			maxRetries: 3,
			retryDelay: 1000,
			backoffMultiplier: 2,
		},
	);
}

// Retry with custom configuration
async function processPayment(paymentData: any) {
	return retryOperation(
		async () => {
			const result = await paymentService.process(paymentData);
			return result;
		},
		'process payment',
		{
			maxRetries: 5,
			retryDelay: 2000,
			backoffMultiplier: 1.5,
		},
	);
}
```

#### `retryObservable` - For Observable-based operations

Use this for RxJS Observables, particularly for gRPC calls:

```typescript
import { retryObservable } from '@app/utils';
import { Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

// Retry a gRPC call
function getVendorData(vendorId: string): Observable<VendorData> {
  const logger = new Logger('VendorService');
  const grpcCall = this.vendorService.getVendorById({ id: vendorId });

  return retryObservable(
    grpcCall,
    'get vendor data',
    {
      logger,
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    }
  );
}

// Use in controllers with firstValueFrom
async getVendorById(id: string) {
  const observable = this.client.invoke('getVendorById', { id });
  const retriedObservable = retryObservable(
    observable,
    'gRPC call to getVendorById',
    { logger: this.logger }
  );

  return await firstValueFrom(retriedObservable);
}
```

#### Retry Configuration Options

Both utilities accept the same configuration options:

```typescript
interface RetryOptions {
	maxRetries?: number; // Default: 3
	retryDelay?: number; // Default: 1000ms
	backoffMultiplier?: number; // Default: 2 (exponential backoff)
	logger?: Logger; // NestJS Logger instance
}
```

### For Data Transformation

```typescript
// Import data transformation utilities
import { formatData, transformData } from '@app/utils';

// Transform API response data
const rawData = {
	user_id: 123,
	first_name: 'John',
	last_name: 'Doe',
	created_at: '2024-01-01T00:00:00Z',
};

const transformedData = transformData(rawData, {
	user_id: 'id',
	first_name: 'firstName',
	last_name: 'lastName',
	created_at: 'createdAt',
});

// Result: { id: 123, firstName: 'John', lastName: 'Doe', createdAt: '2024-01-01T00:00:00Z' }

// Format data for display
const formattedData = formatData(transformedData, {
	id: (value) => `User-${value}`,
	createdAt: (value) => new Date(value).toLocaleDateString(),
});
```

### For Validation Utilities

```typescript
// Import validation utilities
import { sanitizeInput, validateEmail, validatePhone } from '@app/utils';

// Validate email addresses
const email = 'user@example.com';
if (validateEmail(email)) {
	console.log('Valid email address');
} else {
	console.log('Invalid email address');
}

// Validate phone numbers
const phone = '+1-555-123-4567';
if (validatePhone(phone)) {
	console.log('Valid phone number');
} else {
	console.log('Invalid phone number');
}

// Sanitize user input
const userInput = '<script>alert("xss")</script>Hello World';
const sanitizedInput = sanitizeInput(userInput);
// Result: 'Hello World'
```

### For Date/Time Helpers

```typescript
// Import date/time utilities
import { addDays, formatDate, isExpired, parseDate } from '@app/utils';

// Format dates
const date = new Date('2024-01-01T00:00:00Z');
const formatted = formatDate(date, 'YYYY-MM-DD');
// Result: '2024-01-01'

// Parse date strings
const dateString = '2024-01-01';
const parsedDate = parseDate(dateString);

// Add days to date
const futureDate = addDays(date, 7);

// Check if date is expired
const expiryDate = new Date('2024-01-01T00:00:00Z');
if (isExpired(expiryDate)) {
	console.log('Date has expired');
}
```

### For String Utilities

```typescript
// Import string utilities
import { capitalize, generateRandomString, slugify, truncate } from '@app/utils';

// Capitalize strings
const text = 'hello world';
const capitalized = capitalize(text);
// Result: 'Hello World'

// Create URL-friendly slugs
const title = 'My Awesome Blog Post!';
const slug = slugify(title);
// Result: 'my-awesome-blog-post'

// Truncate long strings
const longText = 'This is a very long text that needs to be truncated';
const truncated = truncate(longText, 20);
// Result: 'This is a very long...'

// Generate random strings
const randomString = generateRandomString(10);
// Result: 'aB3x9mK2pQ'
```

## Key Benefits

- **Code Reuse**: Eliminates duplication of common utility functions
- **Consistency**: Ensures uniform behavior for common operations
- **Maintainability**: Centralized updates for utility functions
- **Reliability**: Battle-tested utility functions used across the system
- **Type Safety**: Full TypeScript support with proper type definitions

## Dependencies

- TypeScript for type definitions
- `retry` library for Promise-based retry mechanisms
- `rxjs` for Observable-based retry mechanisms
- `@nestjs/common` for Logger integration
