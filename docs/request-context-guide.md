# 🔄 Request Context Propagation Guide

## Overview

This guide explains how request context is maintained throughout the entire request lifecycle in the Venta backend, including its propagation across services, events, logs, and errors.

## 📋 Table of Contents

1. [Request Context](#request-context)
2. [Context Propagation](#context-propagation)
3. [Integration Points](#integration-points)
4. [Best Practices](#best-practices)
5. [Examples](#examples)

## Request Context

### Core Context Data

```typescript
interface RequestContext {
	requestId: string; // Unique ID for each request
	correlationId: string; // Links related requests/events
	userId?: string; // Current user if authenticated
	domain: string; // Domain handling the request
	timestamp: string; // Request start time
	source: string; // Source service/client
}
```

### Context Storage

```typescript
// libs/nest/modules/networking/request-context/request-context.service.ts
@Injectable()
export class RequestContextService {
	private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

	getContext(): RequestContext | undefined {
		return this.asyncLocalStorage.getStore();
	}

	run(context: RequestContext, next: () => Promise<any>) {
		return this.asyncLocalStorage.run(context, next);
	}

	getRequestId(): string | undefined {
		return this.getContext()?.requestId;
	}

	getCorrelationId(): string | undefined {
		return this.getContext()?.correlationId;
	}

	getUserId(): string | undefined {
		return this.getContext()?.userId;
	}
}
```

## Context Propagation

### HTTP Middleware

```typescript
// libs/nest/modules/networking/request-context/request-context.middleware.ts
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
	constructor(private readonly contextService: RequestContextService) {}

	use(req: Request, res: Response, next: Function) {
		const requestId = req.headers['x-request-id'] || uuid();
		const correlationId = req.headers['x-correlation-id'] || requestId;
		const userId = req.user?.id;

		const context: RequestContext = {
			requestId,
			correlationId,
			userId,
			domain: process.env.DOMAIN_NAME,
			timestamp: new Date().toISOString(),
			source: req.headers['user-agent'] || 'unknown',
		};

		// Store context
		return this.contextService.run(context, () => {
			// Add headers for downstream services
			res.setHeader('x-request-id', requestId);
			res.setHeader('x-correlation-id', correlationId);

			next();
		});
	}
}
```

### gRPC Interceptor

```typescript
// libs/nest/modules/networking/request-context/grpc-context.interceptor.ts
@Injectable()
export class GrpcContextInterceptor implements NestInterceptor {
	constructor(private readonly contextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const rpc = context.switchToRpc();
		const metadata = rpc.getContext();

		const requestId = metadata.get('x-request-id')[0] || uuid();
		const correlationId = metadata.get('x-correlation-id')[0] || requestId;

		const ctx: RequestContext = {
			requestId,
			correlationId,
			domain: process.env.DOMAIN_NAME,
			timestamp: new Date().toISOString(),
			source: 'grpc',
		};

		return from(this.contextService.run(ctx, () => next.handle().toPromise()));
	}
}
```

### WebSocket Gateway

```typescript
// libs/nest/modules/networking/request-context/ws-context.interceptor.ts
@Injectable()
export class WsContextInterceptor implements NestInterceptor {
	constructor(private readonly contextService: RequestContextService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const client = context.switchToWs().getClient();

		const requestId = client.handshake.headers['x-request-id'] || uuid();
		const correlationId = client.handshake.headers['x-correlation-id'] || requestId;
		const userId = client.user?.id;

		const ctx: RequestContext = {
			requestId,
			correlationId,
			userId,
			domain: process.env.DOMAIN_NAME,
			timestamp: new Date().toISOString(),
			source: 'websocket',
		};

		return from(this.contextService.run(ctx, () => next.handle().toPromise()));
	}
}
```

## Integration Points

### Logging Integration

```typescript
// libs/nest/modules/core/logger/app-logger.service.ts
@Injectable()
export class AppLogger implements LoggerService {
	constructor(private readonly contextService: RequestContextService) {}

	log(message: string, context: Record<string, any> = {}) {
		const requestContext = this.contextService.getContext();

		console.log(
			JSON.stringify({
				message,
				level: 'info',
				timestamp: new Date().toISOString(),
				requestId: requestContext?.requestId,
				correlationId: requestContext?.correlationId,
				userId: requestContext?.userId,
				domain: requestContext?.domain,
				...context,
			}),
		);
	}

	error(message: string, trace?: string, context: Record<string, any> = {}) {
		const requestContext = this.contextService.getContext();

		console.error(
			JSON.stringify({
				message,
				level: 'error',
				timestamp: new Date().toISOString(),
				requestId: requestContext?.requestId,
				correlationId: requestContext?.correlationId,
				userId: requestContext?.userId,
				domain: requestContext?.domain,
				trace,
				...context,
			}),
		);
	}
}
```

### Error Handling

```typescript
// libs/nest/errors/app-exception.filter.ts
@Catch(AppError)
export class AppExceptionFilter implements ExceptionFilter {
	constructor(
		private readonly contextService: RequestContextService,
		private readonly logger: AppLogger,
	) {}

	catch(error: AppError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();
		const requestContext = this.contextService.getContext();

		// Log error with context
		this.logger.error('Application error', {
			type: error.type,
			code: error.code,
			message: error.message,
			stack: error.stack,
			context: {
				...error.context,
				requestId: requestContext?.requestId,
				correlationId: requestContext?.correlationId,
				userId: requestContext?.userId,
				domain: requestContext?.domain,
			},
		});

		// Return error response
		response.status(this.getHttpStatus(error.type)).json({
			type: error.type,
			code: error.code,
			message: error.message,
			requestId: requestContext?.requestId,
		});
	}
}
```

### Event Emission

```typescript
// libs/nest/modules/messaging/events/domain-event.service.ts
@Injectable()
export class DomainEventService {
	constructor(
		private readonly contextService: RequestContextService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async emit<T extends object>(eventName: string, data: T) {
		const requestContext = this.contextService.getContext();

		const event: DomainEvent<T> = {
			id: uuid(),
			type: eventName,
			timestamp: new Date().toISOString(),
			context: {
				requestId: requestContext?.requestId,
				correlationId: requestContext?.correlationId,
				userId: requestContext?.userId,
				domain: requestContext?.domain,
			},
			data,
		};

		await this.eventEmitter.emit(eventName, event);
	}
}
```

### Metrics Collection

```typescript
// libs/nest/modules/monitoring/prometheus/metrics.service.ts
@Injectable()
export class MetricsService {
	constructor(private readonly contextService: RequestContextService) {}

	recordMetric(name: string, value: number, labels: Record<string, string> = {}) {
		const requestContext = this.contextService.getContext();

		// Add context to metric labels
		const contextLabels = {
			domain: requestContext?.domain || 'unknown',
			userId: requestContext?.userId || 'anonymous',
			...labels,
		};

		// Record metric with context
		this.gauge.set(contextLabels, value);
	}
}
```

## Best Practices

### 1. Context Initialization

- Always initialize context at entry points
- Include essential context data
- Use consistent header names
- Generate new IDs when missing

```typescript
// Good: Complete context initialization
const context: RequestContext = {
  requestId: req.headers['x-request-id'] || uuid(),
  correlationId: req.headers['x-correlation-id'] || requestId,
  userId: req.user?.id,
  domain: process.env.DOMAIN_NAME,
  timestamp: new Date().toISOString(),
  source: req.headers['user-agent'] || 'unknown',
};

// Bad: Missing essential context
const context = {
  requestId: uuid(), // Missing correlation
  timestamp: Date.now(), // Wrong format
};
```

### 2. Context Propagation

- Use middleware/interceptors consistently
- Propagate context in all communication
- Maintain correlation across services
- Handle async operations properly

```typescript
// Good: Proper async context handling
async function handleRequest() {
  return this.contextService.run(context, async () => {
    const result = await this.processRequest();
    await this.emitEvent(result);
    return result;
  });
}

// Bad: Context lost in async operations
async function handleRequest() {
  const result = await this.processRequest();
  setTimeout(() => {
    this.emitEvent(result); // Context lost!
  }, 0);
  return result;
}
```

### 3. Error Handling

- Include context in all errors
- Use structured error formats
- Maintain error hierarchy
- Log with full context

```typescript
// Good: Error with context
throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_INPUT, 'Invalid data format', {
	requestId: this.contextService.getRequestId(),
	correlationId: this.contextService.getCorrelationId(),
	field: 'email',
	value: input.email,
});

// Bad: Error without context
throw new Error('Invalid data');
```

### 4. Logging

- Use structured logging
- Include context in all logs
- Use appropriate log levels
- Add relevant metadata

```typescript
// Good: Structured log with context
this.logger.log('Processing request', {
	operation: 'updateUser',
	userId: user.id,
	changes: ['email', 'name'],
});

// Bad: Unstructured log
console.log('Processing user update');
```

## Examples

### Complete Request Flow

```typescript
// Example of a complete request flow with context
@Controller('vendors')
export class VendorController {
	constructor(
		private readonly vendorService: VendorService,
		private readonly logger: AppLogger,
		private readonly contextService: RequestContextService,
	) {}

	@Put(':id/location')
	async updateLocation(@Param('id') vendorId: string, @Body() location: LocationData) {
		this.logger.log('Updating vendor location', {
			vendorId,
			location,
			operation: 'updateLocation',
		});

		try {
			// Service call maintains context
			const result = await this.vendorService.updateLocation(vendorId, location);

			this.logger.log('Vendor location updated', {
				vendorId,
				success: true,
			});

			return result;
		} catch (error) {
			// Error includes context
			throw new AppError(ErrorType.VALIDATION, ErrorCodes.INVALID_LOCATION, 'Failed to update vendor location', {
				vendorId,
				location,
				requestId: this.contextService.getRequestId(),
			});
		}
	}
}
```

### Cross-Service Communication

```typescript
// Example of context propagation across services
@Injectable()
export class LocationService {
	constructor(
		private readonly contextService: RequestContextService,
		private readonly eventService: DomainEventService,
		private readonly logger: AppLogger,
	) {}

	async updateLocation(vendorId: string, location: LocationData) {
		const context = this.contextService.getContext();

		// Log with context
		this.logger.log('Processing location update', {
			vendorId,
			location,
		});

		// Update location
		await this.locationRepository.update(vendorId, location);

		// Emit event with context
		await this.eventService.emit('location.vendor.updated', {
			vendorId,
			location,
			timestamp: new Date(),
		});

		// Make gRPC call with context
		const client = this.createGrpcClient({
			'x-request-id': context.requestId,
			'x-correlation-id': context.correlationId,
		});

		await client.notifyLocationUpdate({
			vendorId,
			location,
		});
	}
}
```

## Additional Resources

- [Architecture Guide](./architecture-guide.md)
- [Developer Guide](./developer-guide.md)
- [Monitoring Guide](./monitoring-guide.md)
- [Testing Guide](./testing-guide.md)
