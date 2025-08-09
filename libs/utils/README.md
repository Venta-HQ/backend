# @venta/utils

Generic utility functions and helpers that can be used across any project. These utilities are domain-agnostic and focus on common programming patterns and operations.

## Categories

### Type Guards (`type-guards.util.ts`)

Type-safe runtime checks for common data types and structures.

```typescript
import { isNonEmptyString, isValidArray, isValidNumber } from '@venta/utils';

// String validation
const input = getUserInput();
if (isNonEmptyString(input)) {
	// TypeScript knows input is a non-empty string
	processString(input);
}

// Array validation with custom type guard
const data = getApiResponse();
if (isValidArray(data, isValidNumber)) {
	// TypeScript knows data is number[]
	const sum = data.reduce((a, b) => a + b, 0);
}

// Object property validation
interface User {
	id: string;
	name: string;
}
const obj = getObject();
if (hasRequiredProperties<User>(obj, ['id', 'name'])) {
	// TypeScript knows obj has id and name properties
	console.log(obj.id, obj.name);
}
```

### Validation (`validation.util.ts`)

Common validation patterns and schemas using Zod.

```typescript
import { coordinatesSchema, paginationSchema, safeParse } from '@venta/utils';

// Pagination validation
const query = { page: '2', limit: '20' };
const pagination = safeParse(paginationSchema, {
	page: parseInt(query.page),
	limit: parseInt(query.limit),
});
// Returns { page: 2, limit: 20 } or null if invalid

// Date range validation
const dateRange = safeParse(dateRangeSchema, {
	startDate: '2024-01-01T00:00:00Z',
	endDate: '2024-12-31T23:59:59Z',
});
// Ensures endDate is after startDate

// Coordinates validation
const location = safeParse(coordinatesSchema, {
	lat: 40.7128,
	long: -74.006,
});
// Ensures lat/long are within valid ranges
```

### Date Utilities (`date.util.ts`)

Type-safe date manipulation and formatting functions.

```typescript
import { endOfDay, formatDuration, getRelativeTimeString, parseDuration, startOfDay } from '@venta/utils';

// Date boundaries
const today = new Date();
const dayStart = startOfDay(today); // 2024-03-21T00:00:00.000Z
const dayEnd = endOfDay(today); // 2024-03-21T23:59:59.999Z

// Duration formatting
const ms = 3661000; // 1h 1m 1s
console.log(formatDuration(ms)); // "1h 1m"

// Duration parsing
const duration = parseDuration('1h 30m'); // 5400000 (ms)

// Relative time
const date = new Date('2024-03-20T12:00:00Z');
console.log(getRelativeTimeString(date)); // "1d ago"
```

### Retry Operations (`retry.util.ts`)

Type-safe retry logic for async operations and observables.

```typescript
import { retryObservable, retryOperation } from '@venta/utils';

// Retry Promise-based operations
async function fetchData() {
	return await retryOperation(() => api.getData(), 'Fetch user data', {
		maxRetries: 3,
		retryDelay: 1000,
		backoffMultiplier: 2,
		retryCondition: (error) => error.status === 503,
	});
}

// Retry Observable operations
const data$ = retryObservable(source$, 'Stream user events', {
	maxRetries: 3,
	retryDelay: 1000,
	jitter: true,
});
```

### Proto Path Resolution (`proto-path.util.ts`)

Utilities for resolving Protocol Buffer file paths.

```typescript
import { ProtoPathUtil } from '@venta/utils';

// Resolve proto file path
const protoPath = ProtoPathUtil.resolveProtoPath('user.proto');

// Resolve relative to dirname
const relativePath = ProtoPathUtil.resolveFromDirname(__dirname, '../protos/user.proto');
```

## Best Practices

1. **Type Safety**

   - All utilities are fully typed
   - Use type guards to narrow types
   - Return `null` instead of throwing for validation functions

2. **Error Handling**

   - Validation functions return `boolean` or `null`
   - Retry utilities handle errors gracefully
   - Clear error messages and contexts

3. **Performance**

   - Efficient implementations
   - No unnecessary object allocations
   - Lazy evaluation where possible

4. **Testing**
   - Each utility has unit tests
   - Edge cases are covered
   - Validation functions are tested with invalid inputs

## Contributing

When adding new utilities:

1. Keep them domain-agnostic
2. Add comprehensive JSDoc comments
3. Include usage examples
4. Add unit tests
5. Update this README
