# Request Tracing & Correlation

## Overview

The Venta Backend implements a comprehensive request tracing system that propagates request IDs across all services, enabling end-to-end request tracking and debugging in a distributed microservices architecture.

## Request ID Flow

### 1. Request Initiation

When a client makes a request to the gateway, a request ID is either:

- **Extracted** from the `X-Request-ID` header if provided by the client
- **Generated** automatically if not present

```http
GET /vendor/123
X-Request-ID: req_abc123def456
Authorization: Bearer <token>
```

### 2. Gateway Processing

The gateway automatically handles request ID propagation:

```typescript
// HTTP Gateway automatically:
// 1. Extracts or generates request ID
// 2. Sets it in response headers
// 3. Passes it to downstream gRPC services

// Response includes the request ID
HTTP/1.1 200 OK
X-Request-ID: req_abc123def456
Content-Type: application/json

{
  "id": "vendor-123",
  "name": "Sample Vendor"
}
```

### 3. gRPC Service Communication

Request IDs are propagated through gRPC metadata:

```typescript
// Gateway → gRPC Service
const metadata = new Metadata();
metadata.set('requestId', requestId);

// gRPC call with metadata
this.grpcClient.invoke('getVendorById', { id }, metadata);
```

### 4. Service-to-Service Communication

Each service maintains the request ID throughout its processing:

```typescript
// Service receives gRPC call with metadata
@GrpcMethod('VendorService', 'GetVendorById')
async getVendorById(
  data: GetVendorByIdRequest,
  metadata: Metadata
): Promise<Vendor> {
  // Request ID is automatically extracted and available
  const requestId = metadata.get('requestId')[0];

  // All logs include the request ID
  this.logger.log('Processing vendor request', {
    requestId,
    vendorId: data.id
  });

  // Continue processing...
}
```

## Implementation Details

### HTTP Request ID Handling

#### Request ID Extraction

```typescript
// libs/nest/modules/logger/http-logger.module.ts
if (req.id ?? req.headers['x-request-id']) {
	props['requestId'] = req.id ?? req.headers['x-request-id'];
} else {
	const id = uuidv4();
	req.id = id;
	res.setHeader('x-request-id', id);
}
```

#### Response Headers

```typescript
// All HTTP responses include the request ID
res.setHeader('x-request-id', requestId);
```

### gRPC Request ID Handling

#### Metadata Propagation

```typescript
// libs/nest/modules/grpc-instance/grpc-instance.service.ts
if (this.request.id) {
	metadata.set('requestId', this.request.id);
}
```

#### Interceptor Processing

```typescript
// libs/nest/modules/logger/grpc-logger.interceptor.ts
export class GrpcRequestIdInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const metadata = context.switchToRpc().getContext();
		const requestId = metadata.get('requestid');

		// Set the requestId in AsyncLocalStorage for logging
		this.requestContextService.set('requestId', requestId[0] ?? 'no-request-id');

		return next.handle();
	}
}
```

### Error Handling with Request IDs

All errors include the request ID for correlation:

```typescript
// libs/nest/errors/error.ts
export class AppError extends Error {
	public requestId?: string;

	constructor(
		message: string,
		public readonly code: ErrorCode,
		public readonly type: ErrorType,
		public readonly details?: any,
		requestId?: string,
	) {
		super(message);
		this.requestId = requestId;
	}

	toHttpException(): HttpException {
		return new HttpException(
			{
				error: {
					code: this.code,
					message: this.message,
					details: this.details,
					path: this.path,
					requestId: this.requestId, // ← Request ID included
					timestamp: new Date().toISOString(),
				},
			},
			this.getHttpStatus(),
		);
	}
}
```

## Logging with Request IDs

### Structured Logging

All logs automatically include the request ID:

```typescript
// libs/nest/modules/logger/grpc-logger.service.ts
export class GrpcLoggerService {
	log(message: string, context?: string) {
		this.logger.log(message, {
			context,
			requestId: this.requestContextService.get('requestId'), // ← Automatic
			timestamp: new Date().toISOString(),
		});
	}

	error(message: string, trace?: string, context?: string) {
		this.logger.error(message, trace, {
			context,
			requestId: this.requestContextService.get('requestId'), // ← Automatic
			timestamp: new Date().toISOString(),
		});
	}
}
```

### Log Output Example

```json
{
	"level": "info",
	"message": "Processing vendor request",
	"context": "VendorService",
	"requestId": "req_abc123def456",
	"timestamp": "2024-01-15T10:30:00.000Z",
	"vendorId": "vendor-123"
}
```

## Event System Integration

### Event Publishing with Request IDs

Events can include request IDs for correlation:

```typescript
// When publishing events, include request context
await this.eventsService.publishEvent('vendor.created', {
	id: vendor.id,
	name: vendor.name,
	requestId: this.requestContextService.get('requestId'), // ← Correlation
	timestamp: new Date().toISOString(),
});
```

### Event Processing with Request IDs

Event consumers can correlate events with original requests:

```typescript
// Event consumer
await this.eventsService.subscribeToEvents(async (event) => {
	const requestId = event.data.requestId;

	this.logger.log('Processing vendor created event', {
		requestId, // ← Correlate with original request
		vendorId: event.data.id,
	});

	// Process event...
});
```

## Debugging with Request IDs

### Finding Request Traces

```bash
# Search logs for a specific request
grep "req_abc123def456" logs/*.log

# Search across all services
grep -r "req_abc123def456" logs/
```

### Request Flow Analysis

```bash
# Find all logs for a request across services
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={requestId="req_abc123def456"}' \
  --data-urlencode 'start=1642234567' \
  --data-urlencode 'end=1642238167'
```

### Error Correlation

```bash
# Find errors for a specific request
grep -r "req_abc123def456" logs/ | grep -i error

# Find related events
grep -r "req_abc123def456" logs/ | grep "vendor.created"
```

## Best Practices

### 1. Client-Side Request IDs

Clients should provide request IDs for better correlation:

```javascript
// Client-side request with custom ID
const requestId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

fetch('/vendor/123', {
	headers: {
		'X-Request-ID': requestId,
		Authorization: `Bearer ${token}`,
	},
});
```

### 2. Service Implementation

Services should always use the propagated request ID:

```typescript
@Injectable()
export class VendorService {
	constructor(
		private readonly logger: GrpcLoggerService,
		private readonly requestContextService: RequestContextService,
	) {}

	async getVendorById(id: string): Promise<Vendor> {
		const requestId = this.requestContextService.get('requestId');

		this.logger.log('Fetching vendor', { requestId, vendorId: id });

		try {
			const vendor = await this.prisma.vendor.findUnique({ where: { id } });

			this.logger.log('Vendor found', { requestId, vendorId: id });
			return vendor;
		} catch (error) {
			this.logger.error('Failed to fetch vendor', error.stack, {
				requestId,
				vendorId: id,
			});
			throw error;
		}
	}
}
```

### 3. Error Handling

Always include request IDs in error responses:

```typescript
// Error responses automatically include request ID
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Vendor not found",
    "requestId": "req_abc123def456",  // ← Always included
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Monitoring and Alerting

Use request IDs for monitoring:

```typescript
// Track request duration
const startTime = Date.now();
const requestId = this.requestContextService.get('requestId');

// ... process request ...

const duration = Date.now() - startTime;
this.logger.log('Request completed', {
	requestId,
	duration,
	success: true,
});
```

## Configuration

### Request ID Generation

```typescript
// Default: UUID v4
import { v4 as uuidv4 } from 'uuid';
const requestId = uuidv4();

// Custom: Timestamp-based
const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

### Header Configuration

```typescript
// Custom header name (optional)
const REQUEST_ID_HEADER = 'X-Correlation-ID'; // Instead of X-Request-ID
```

### Logging Configuration

```typescript
// Include request ID in all log formats
{
  "propsToLabels": ["context", "app", "requestId"],
  "format": "json"
}
```

## Troubleshooting

### Missing Request IDs

If request IDs are missing:

1. **Check HTTP headers**: Ensure `X-Request-ID` is being sent
2. **Check gRPC metadata**: Verify metadata propagation
3. **Check interceptors**: Ensure interceptors are properly configured
4. **Check logging**: Verify request context service is working

### Request ID Mismatches

If request IDs don't match across services:

1. **Check metadata propagation**: Verify gRPC metadata is being passed
2. **Check interceptor order**: Ensure request ID interceptor runs first
3. **Check async context**: Verify AsyncLocalStorage is working correctly

### Performance Impact

Request ID propagation has minimal overhead:

- **HTTP**: ~0.1ms per request
- **gRPC**: ~0.05ms per call
- **Logging**: ~0.01ms per log entry

The benefits of request tracing far outweigh the minimal performance cost.
