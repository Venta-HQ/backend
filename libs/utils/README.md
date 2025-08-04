# Utilities Library

## Purpose

The Utilities library provides common utility functions and helper methods that are used across the Venta backend system. It contains reusable code that doesn't belong to any specific domain but is needed by multiple services.

## What It Contains

- **Retry Logic**: Robust retry mechanisms for handling transient failures
- **Data Transformation**: Helper functions for data manipulation and formatting
- **Validation Utilities**: Common validation and sanitization functions
- **Date/Time Helpers**: Date manipulation and formatting utilities
- **String Utilities**: String processing and formatting functions
- **Math Utilities**: Common mathematical operations and calculations

## Usage

This library is imported by microservices and other libraries when common utility functions are needed.

### For Retry Operations
```typescript
// Import retry utilities
import { retry } from '@app/utils';

// Retry a function with exponential backoff
async function fetchUserData(userId: string) {
  return retry(
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      return response.json();
    },
    {
      retries: 3,
      delay: 1000,
      backoff: 'exponential'
    }
  );
}

// Retry with custom error handling
async function processPayment(paymentData: any) {
  return retry(
    async (attempt) => {
      console.log(`Payment attempt ${attempt}`);
      const result = await paymentService.process(paymentData);
      return result;
    },
    {
      retries: 5,
      delay: 2000,
      onRetry: (error, attempt) => {
        console.log(`Retrying payment, attempt ${attempt}:`, error.message);
      }
    }
  );
}
```

### For Data Transformation
```typescript
// Import data transformation utilities
import { transformData, formatData } from '@app/utils';

// Transform API response data
const rawData = {
  user_id: 123,
  first_name: 'John',
  last_name: 'Doe',
  created_at: '2024-01-01T00:00:00Z'
};

const transformedData = transformData(rawData, {
  user_id: 'id',
  first_name: 'firstName',
  last_name: 'lastName',
  created_at: 'createdAt'
});

// Result: { id: 123, firstName: 'John', lastName: 'Doe', createdAt: '2024-01-01T00:00:00Z' }

// Format data for display
const formattedData = formatData(transformedData, {
  id: (value) => `User-${value}`,
  createdAt: (value) => new Date(value).toLocaleDateString()
});
```

### For Validation Utilities
```typescript
// Import validation utilities
import { validateEmail, validatePhone, sanitizeInput } from '@app/utils';

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
import { formatDate, parseDate, addDays, isExpired } from '@app/utils';

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
import { 
  capitalize, 
  slugify, 
  truncate, 
  generateRandomString 
} from '@app/utils';

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

## Dependencies

- TypeScript for type definitions
- Retry library for retry mechanisms 