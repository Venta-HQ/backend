# Utilities Library

## Purpose

The Utilities library provides common utility functions and helper methods that are used across the Venta backend system. It contains reusable code that doesn't belong to any specific domain but is needed by multiple services, ensuring consistency and reducing code duplication.

## Overview

This library provides:
- Retry mechanisms for handling transient failures in Promise-based and Observable-based operations
- Data transformation and formatting utilities
- Validation and sanitization functions
- Date and time manipulation helpers
- String processing and formatting utilities
- Mathematical operations and calculations
- Common helper functions for everyday development tasks

## Usage

### Retry Operations

Use retry utilities for handling transient failures:

```typescript
import { retryOperation, retryObservable } from '@app/utils';

// Retry Promise-based operations
async function fetchData() {
  return retryOperation(
    async () => {
      const result = await externalService.getData();
      return result;
    },
    'fetch data',
    {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    }
  );
}

// Retry Observable-based operations (e.g., gRPC calls)
function getServiceData(id: string) {
  const observable = this.grpcService.getData({ id });
  
  return retryObservable(
    observable,
    'get service data',
    {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    }
  );
}
```

### Data Transformation

Use utilities for data manipulation and formatting:

```typescript
import { transformData, formatData, sanitizeInput } from '@app/utils';

// Transform data structure
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

// Format data for display
const formattedData = formatData(transformedData, {
  id: (value) => `User-${value}`,
  createdAt: (value) => new Date(value).toLocaleDateString(),
});

// Sanitize user input
const sanitizedInput = sanitizeInput(userInput);
```

### Validation Utilities

Use validation functions for data validation:

```typescript
import { validateEmail, validatePhone, validateUrl } from '@app/utils';

// Validate email addresses
if (validateEmail(email)) {
  // Process valid email
}

// Validate phone numbers
if (validatePhone(phone)) {
  // Process valid phone
}

// Validate URLs
if (validateUrl(url)) {
  // Process valid URL
}
```

### Date and Time Helpers

Use date/time utilities for common operations:

```typescript
import { 
  formatDate, 
  parseDate, 
  addDays, 
  isExpired,
  getTimeDifference 
} from '@app/utils';

// Format dates
const formatted = formatDate(date, 'YYYY-MM-DD');

// Parse date strings
const parsedDate = parseDate(dateString);

// Add days to date
const futureDate = addDays(date, 7);

// Check if date is expired
if (isExpired(expiryDate)) {
  // Handle expired date
}

// Get time difference
const diff = getTimeDifference(startDate, endDate);
```

### String Utilities

Use string processing utilities:

```typescript
import { 
  capitalize, 
  slugify, 
  truncate, 
  generateRandomString 
} from '@app/utils';

// Capitalize strings
const capitalized = capitalize('hello world');

// Create URL-friendly slugs
const slug = slugify('My Awesome Title!');

// Truncate long strings
const truncated = truncate(longText, 50);

// Generate random strings
const randomString = generateRandomString(10);
```

### Mathematical Operations

Use math utilities for calculations:

```typescript
import { 
  calculateDistance, 
  roundToDecimal, 
  calculatePercentage,
  isWithinRange 
} from '@app/utils';

// Calculate distance between points
const distance = calculateDistance(point1, point2);

// Round numbers
const rounded = roundToDecimal(3.14159, 2);

// Calculate percentages
const percentage = calculatePercentage(25, 100);

// Check if value is within range
if (isWithinRange(value, min, max)) {
  // Value is within range
}
```

## Key Benefits

- **Code Reuse**: Eliminates duplication of common utility functions
- **Consistency**: Ensures uniform behavior for common operations
- **Maintainability**: Centralized updates for utility functions
- **Reliability**: Battle-tested utility functions used across the system
- **Type Safety**: Full TypeScript support with proper type definitions
- **Performance**: Optimized implementations for common operations

## Dependencies

- **TypeScript** for type definitions and compile-time safety
- **RxJS** for Observable-based retry mechanisms
- **NestJS Common** for Logger integration
