# Utils Library

This library provides general utility functions and helper methods for the Venta backend services.

## Overview

The utils library contains common utility functions, retry mechanisms, and helper methods that are used across multiple services. It provides reusable functionality to reduce code duplication and improve maintainability.

## Features

- **Retry Utilities**: Robust retry mechanisms for external service calls
- **Helper Functions**: Common utility functions used across services
- **Error Handling**: Utility functions for error handling and recovery
- **Data Processing**: Common data transformation and processing utilities
- **Validation Helpers**: Utility functions for data validation

## Usage

### Retry Mechanisms

Use retry utilities to handle transient failures in external service calls.

```typescript
import { RetryUtil } from '@app/utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
	async processPayment(paymentData: PaymentData) {
		return await RetryUtil.withRetry(
			async () => {
				return await this.paymentGateway.charge(paymentData);
			},
			{
				maxAttempts: 3,
				delayMs: 1000,
				backoffMultiplier: 2,
				retryCondition: (error) => {
					// Retry on network errors or 5xx responses
					return error.code === 'NETWORK_ERROR' || (error.status >= 500 && error.status < 600);
				},
			},
		);
	}

	async sendWebhook(url: string, data: any) {
		return await RetryUtil.withRetry(
			async () => {
				const response = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					throw new Error(`Webhook failed: ${response.status}`);
				}

				return response.json();
			},
			{ maxAttempts: 5, delayMs: 2000 },
		);
	}
}
```

### Helper Functions

Import common utility functions to avoid code duplication.

```typescript
import { RetryUtil } from '@app/utils';

@Injectable()
export class EmailService {
	async sendEmail(to: string, subject: string, content: string) {
		// Use retry utility for email sending
		return await RetryUtil.withRetry(
			async () => {
				return await this.emailProvider.send({
					to,
					subject,
					content,
				});
			},
			{
				maxAttempts: 3,
				delayMs: 5000,
				retryCondition: (error) => error.code === 'RATE_LIMIT',
			},
		);
	}

	async validateEmail(email: string): Promise<boolean> {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
}
```

### Error Recovery

Use utility functions for graceful error handling and recovery.

```typescript
import { RetryUtil } from '@app/utils';

@Injectable()
export class DataSyncService {
	async syncData() {
		try {
			return await RetryUtil.withRetry(
				async () => {
					const data = await this.externalApi.fetchData();
					await this.processData(data);
					return data;
				},
				{
					maxAttempts: 3,
					delayMs: 1000,
					onRetry: (attempt, error) => {
						this.logger.warn(`Sync attempt ${attempt} failed`, { error: error.message });
					},
				},
			);
		} catch (error) {
			this.logger.error('Data sync failed after all retries', { error: error.message });
			// Fallback to cached data or default values
			return await this.getCachedData();
		}
	}
}
```

## Dependencies

- TypeScript for type safety
- NestJS for framework integration
