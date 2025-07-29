# Nest Utils

This directory contains utility classes and functions that can be shared across the NestJS applications.

## RetryUtil

A robust retry utility that provides exponential backoff and configurable retry logic for handling transient failures in external service calls.

### Features

- **Exponential Backoff**: Automatically increases delay between retries
- **Configurable Retries**: Set maximum retry attempts and delay intervals
- **Comprehensive Logging**: Detailed logging of retry attempts and failures
- **Flexible Usage**: Both instance-based and static method usage
- **Type Safety**: Full TypeScript support with generic return types

### Usage

#### Instance-based Usage

```typescript
import { Logger } from '@nestjs/common';
import { RetryUtil } from '../../../libs/nest/utils';

@Injectable()
export class MyService {
	private readonly logger = new Logger(MyService.name);
	private readonly retryUtil: RetryUtil;

	constructor() {
		this.retryUtil = new RetryUtil({
			maxRetries: 3,
			retryDelay: 1000,
			logger: this.logger,
		});
	}

	async callExternalService() {
		return this.retryUtil.retryOperation(() => externalApi.call(), 'Calling external API');
	}
}
```

#### Static Method Usage

```typescript
import { RetryUtil } from '../../../libs/nest/utils';

// One-off retry operation
const result = await RetryUtil.retry(() => externalApi.call(), 'One-time API call', { maxRetries: 2, retryDelay: 500 });
```

### Configuration Options

| Option              | Type     | Default                      | Description                        |
| ------------------- | -------- | ---------------------------- | ---------------------------------- |
| `maxRetries`        | `number` | `3`                          | Maximum number of retry attempts   |
| `retryDelay`        | `number` | `1000`                       | Base delay in milliseconds         |
| `backoffMultiplier` | `number` | `2`                          | Multiplier for exponential backoff |
| `logger`            | `Logger` | `new Logger(RetryUtil.name)` | Logger instance for retry logging  |

### Retry Behavior

With default settings (maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2):

- **Attempt 1**: Immediate execution
- **Attempt 2**: After 1000ms delay
- **Attempt 3**: After 2000ms delay
- **Attempt 4**: After 4000ms delay
- **Final**: Throw error after 4 total attempts

### Before and After Examples

**Before:**

```typescript
private async retryOperation<T>(operation: () => Promise<T>, description: string, retryCount = 0): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		this.logger.error(`Error in ${description}:`, error);
		throw AppError.internal(ErrorCodes.DATABASE_ERROR, { operation: description });
	}
}
```

**After:**

```typescript
import { RetryUtil } from '../../../libs/nest/utils';

await this.retryUtil.retryOperation(operation, description);
```
