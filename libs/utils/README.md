# Utils Library

This library provides general utility functions and helper methods for the Venta backend services.

## Overview

The utils library contains common utility functions and retry mechanisms that are used across multiple services. It provides reusable functionality to reduce code duplication and improve maintainability.

## Features

- **Retry Utilities**: Robust retry mechanisms for external service calls
- **Configurable Retry Options**: Customizable retry behavior with exponential backoff
- **Error Handling**: Structured error logging and retry tracking
- **Instance and Static Methods**: Both class-based and static utility methods

## Usage

### Retry Mechanisms

Use retry utilities to handle transient failures in external service calls with configurable retry behavior.

#### Instance-based Usage

```typescript
import { RetryUtil } from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentService {
	private readonly retryUtil: RetryUtil;

	constructor() {
		this.retryUtil = new RetryUtil({
			maxRetries: 3,
			retryDelay: 1000,
			backoffMultiplier: 2,
			logger: new Logger(PaymentService.name),
		});
	}

	async processPayment(paymentData: PaymentData) {
		return await this.retryUtil.retryOperation(async () => {
			return await this.paymentGateway.charge(paymentData);
		}, `Processing payment for ${paymentData.amount}`);
	}
}
```

#### Static Method Usage

```typescript
import { RetryUtil } from '@app/utils';

@Injectable()
export class EmailService {
	async sendEmail(to: string, subject: string, content: string) {
		return await RetryUtil.retry(
			async () => {
				return await this.emailProvider.send({
					to,
					subject,
					content,
				});
			},
			`Sending email to ${to}`,
			{
				maxRetries: 3,
				retryDelay: 5000,
				backoffMultiplier: 1.5,
			},
		);
	}
}
```

### Retry Configuration

Configure retry behavior with the following options:

```typescript
interface RetryOptions {
	maxRetries?: number; // Default: 3
	retryDelay?: number; // Default: 1000ms
	backoffMultiplier?: number; // Default: 2 (exponential backoff)
	logger?: Logger; // Default: new Logger(RetryUtil.name)
}
```

### Error Handling

The retry utility provides structured logging and error handling:

```typescript
import { RetryUtil } from '@app/utils';

@Injectable()
export class DataSyncService {
	async syncData() {
		try {
			return await RetryUtil.retry(
				async () => {
					const data = await this.externalApi.fetchData();
					await this.processData(data);
					return data;
				},
				'Fetching and processing external data',
				{
					maxRetries: 3,
					retryDelay: 1000,
				},
			);
		} catch (error) {
			// Handle final failure after all retries
			this.logger.error('Data sync failed after all retries', { error: error.message });
			return await this.getCachedData();
		}
	}
}
```

### Real-world Example

Here's how the retry utility is used in the Algolia sync service:

```typescript
import { RetryUtil } from '@app/utils';

@Injectable()
export class AlgoliaSyncService {
	private readonly retryUtil: RetryUtil;

	constructor() {
		this.retryUtil = new RetryUtil({
			logger: this.logger,
			maxRetries: 3,
			retryDelay: 1000,
		});
	}

	async handleVendorCreated(vendor: any) {
		await this.retryUtil.retryOperation(
			() => this.algoliaService.createObject('vendor', vendor),
			`Creating vendor in Algolia: ${vendor.id}`,
		);
	}
}
```

## Dependencies

- NestJS Logger for structured logging
- TypeScript for type safety
