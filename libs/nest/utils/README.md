# RetryUtil

A utility class that provides configurable retry logic with exponential backoff for handling transient failures in async operations.

## Features

- **Configurable Retry Logic**: Customizable retry attempts and delays
- **Exponential Backoff**: Automatic backoff multiplier for retry delays
- **Logging Integration**: Built-in logging with customizable logger
- **Static Method**: Convenient static method for one-off retry operations
- **Type Safety**: Full TypeScript support with generic return types

## Usage

### Instance-based Usage

```typescript
import { RetryUtil } from '@app/nest/utils';
import { Logger } from '@nestjs/common';

@Injectable()
export class MyService {
	private readonly retryUtil: RetryUtil;

	constructor() {
		this.retryUtil = new RetryUtil({
			maxRetries: 3,
			retryDelay: 1000,
			backoffMultiplier: 2,
			logger: new Logger(MyService.name),
		});
	}

	async fetchData() {
		return this.retryUtil.retryOperation(() => this.externalApiCall(), 'Fetching data from external API');
	}
}
```

### Static Method Usage

```typescript
import { RetryUtil } from '@app/nest/utils';

// One-off retry operation
const result = await RetryUtil.retry(() => fetch('https://api.example.com/data'), 'Fetching external data', {
	maxRetries: 5,
	retryDelay: 2000,
});
```

## Configuration Options

### RetryOptions

```typescript
interface RetryOptions {
	maxRetries?: number; // Maximum retry attempts (default: 3)
	retryDelay?: number; // Initial delay in milliseconds (default: 1000)
	backoffMultiplier?: number; // Exponential backoff multiplier (default: 2)
	logger?: Logger; // Custom logger instance (default: new Logger(RetryUtil.name))
}
```

## Retry Behavior

### Exponential Backoff

The retry delay increases exponentially with each attempt:

- **Attempt 1**: `retryDelay` ms
- **Attempt 2**: `retryDelay * backoffMultiplier` ms
- **Attempt 3**: `retryDelay * backoffMultiplier^2` ms
- And so on...

### Example Timeline

With default settings (`retryDelay: 1000`, `backoffMultiplier: 2`):

```
Attempt 1: Immediate
Attempt 2: +1 second
Attempt 3: +2 seconds
Attempt 4: +4 seconds
Total time: ~7 seconds
```

## Logging

The utility provides detailed logging for each retry attempt:

```typescript
// Success log
'Fetching data from external API';

// Retry warning
'Fetching data from external API failed (attempt 1/4), retrying in 1000ms: Error details';

// Final failure log
'Fetching data from external API failed after 4 attempts: Error details';
```

## Error Handling

- **Transient Failures**: Automatically retries on any thrown error
- **Final Failure**: Re-throws the original error after all retries exhausted
- **No Error Swallowing**: All errors are logged and eventually re-thrown

## Use Cases

### API Calls

```typescript
const userData = await RetryUtil.retry(() => this.userApi.getUser(id), `Fetching user ${id}`, { maxRetries: 3 });
```

### Database Operations

```typescript
const result = await this.retryUtil.retryOperation(
	() => this.prisma.user.create({ data: userData }),
	'Creating user in database',
);
```

### File Operations

```typescript
const fileContent = await RetryUtil.retry(() => fs.promises.readFile(filePath, 'utf8'), `Reading file ${filePath}`, {
	retryDelay: 500,
});
```

## Testing

See `retry.util.test.ts` for comprehensive test coverage including:

- Successful operations
- Failed operations with retries
- Custom configuration options
- Logging behavior
- Error propagation

## Dependencies

- `@nestjs/common` - For Logger interface
