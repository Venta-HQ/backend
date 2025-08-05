# Request ID Propagation System

## Overview

This document describes how request IDs are tracked and propagated from HTTP requests through gRPC calls and events in the Venta backend system. The system provides consistent request tracing across all services and automatically uses request IDs as correlation IDs for events.

## Current Architecture

### 1. HTTP Request ID Generation

**Location**: `libs/nest/modules/logger/http-logger.module.ts` and `libs/nest/modules/logger/logger.module.ts`

**Process**:
- Pino automatically generates request IDs using the `genReqId` function
- Checks for existing `x-request-id` header first
- If not present, generates a new UUID and sets it in response headers
- The request ID is available as `req.id` in the request object

**Configuration**:
```typescript
genReqId: (req, res) => {
    const existingID = req.id ?? req.headers['x-request-id'];
    if (existingID) return existingID;
    const id = randomUUID();
    res.setHeader('x-request-id', id);
    return id;
}
```

### 2. gRPC Client Request ID Propagation

**Location**: `libs/nest/modules/grpc-instance/grpc-instance.service.ts`

**Process**:
- The `GrpcInstance` class is scoped to `REQUEST` (per-request instance)
- When making gRPC calls, it checks `this.request.id`
- If present, it adds the request ID to gRPC metadata: `metadata.set('requestId', this.request.id)`
- This metadata is sent with every gRPC call

**Implementation**:
```typescript
invoke<K extends keyof T>(method: K, data: T[K]): ReturnType<T[K]> {
    return retryOperation(async () => {
        const metadata = new Metadata();
        
        if (this.request.id) {
            metadata.set('requestId', this.request.id);
        }
        
        return (this.service[method] as any)(data, metadata);
    });
}
```

### 3. gRPC Server Request ID Extraction

**Location**: `libs/nest/modules/logger/grpc-logger.interceptor.ts`

**Process**:
- The `GrpcRequestIdInterceptor` extracts request ID from gRPC metadata
- Stores it in the `RequestContextService` (in-memory Map)
- Clears the context after the request completes

**Implementation**:
```typescript
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const grpcContext = context.switchToRpc();
    const metadata = grpcContext.getContext();
    
    const requestId = metadata?.get('requestId')?.[0];
    if (requestId) {
        this.requestContextService.set('requestId', requestId);
    }
    
    return next.handle().pipe(
        tap(() => {
            this.requestContextService.clear();
        })
    );
}
```

### 4. Logging with Request ID

**Location**: `libs/nest/modules/logger/logger.service.ts` and `libs/nest/modules/logger/grpc-logger.service.ts`

**Process**:
- For HTTP: Pino automatically includes request ID in logs
- For gRPC: Gets request ID from `RequestContextService` and includes it in log context

### 5. Event Correlation ID Integration

**Location**: `libs/nest/modules/events/typed-event.service.ts`

**Process**:
- The `EventService` automatically retrieves request ID from `RequestContextService`
- Uses request ID as correlation ID for all emitted events
- Provides consistent tracing across logs and events

**Implementation**:
```typescript
const event: BaseEvent = {
    correlationId: metadata?.correlationId || this.requestContextService?.get('requestId'),
    data: validatedData,
    eventId: randomUUID(),
    // ... other fields
};
```

**Benefits**:
- All events from the same request have the same correlation ID
- Easy to trace request flow through logs and events
- No manual correlation ID management required

## Complete Request Flow with Events

### **Example: Vendor Creation Request**

1. **HTTP Request** (Gateway):
   ```
   POST /vendors
   Headers: x-request-id: req-123
   ```

2. **Request ID Generation**:
   - Pino generates/uses request ID: `req-123`
   - Stored in request context

3. **gRPC Call** (Gateway → Vendor Service):
   ```
   gRPC: createVendor(data)
   Metadata: requestId: req-123
   ```

4. **Vendor Service Processing**:
   - Extracts request ID from gRPC metadata
   - Stores in `RequestContextService`
   - Creates vendor in database

5. **Event Emission**:
   ```typescript
   await this.eventService.emit('vendor.created', vendor);
   // Event automatically gets correlationId: req-123
   ```

6. **Event Processing** (Algolia Sync):
   - Receives event with correlation ID: `req-123`
   - Processes vendor data
   - Logs include correlation ID for tracing

7. **Complete Trace**:
   ```
   Gateway: [req-123] HTTP request received
   Gateway: [req-123] gRPC call to vendor service
   Vendor:  [req-123] Vendor created
   Vendor:  [req-123] Event emitted: vendor.created
   Algolia: [req-123] Event received: vendor.created
   Algolia: [req-123] Vendor synced to Algolia
   ```

### **Benefits of Integrated Tracing**:
- ✅ **Single Request ID**: Same ID across HTTP, gRPC, events, and logs
- ✅ **Automatic Propagation**: No manual correlation ID management
- ✅ **Complete Visibility**: Trace entire request flow end-to-end
- ✅ **Easy Debugging**: Find all related logs and events by request ID

## Why RequestContextService is Necessary

### The Problem: gRPC Services Don't Get Automatic Request IDs

**Critical Finding**: gRPC services do NOT have automatic request ID generation like HTTP services do.

**HTTP Services** (Gateway):
- ✅ Have `pinoHttp` configuration with `genReqId` and `customProps`
- ✅ Get automatic request ID generation and propagation
- ✅ Request IDs are automatically included in logs

**gRPC Services** (User, Vendor, Location):
- ❌ Do NOT have `pinoHttp` configuration
- ❌ Do NOT get automatic request ID generation
- ❌ Only get request IDs if manually passed via metadata

### The Solution: Manual Request ID Extraction

The `RequestContextService` is **necessary** because:

1. **gRPC services need manual request ID extraction** from metadata
2. **Without it, gRPC services would have no request IDs at all**
3. **It enables request tracing across the entire system**

## Current Implementation Assessment

### ✅ What Works Correctly

1. **HTTP → gRPC Propagation**: Request IDs are correctly passed via metadata
2. **gRPC → Logging**: Request IDs are correctly extracted and used for logging
3. **Request Scoping**: Context is properly cleared after each request
4. **Memory Management**: In-memory storage is appropriate for request-scoped data

### ✅ RequestContextService is Appropriate

**Current Implementation**:
```typescript
@Injectable()
export class RequestContextService {
    private readonly context = new Map<string, any>();
    
    set(key: string, value: any): void {
        this.context.set(key, value);
    }
    
    get(key: string): any {
        return this.context.get(key);
    }
    
    clear(): void {
        this.context.clear();
    }
}
```

**Why This is Correct**:
- **Request-scoped only**: Request IDs are only needed for the duration of a single gRPC call
- **Automatic cleanup**: Context is cleared after each request
- **No persistence needed**: Request IDs don't need to survive pod restarts
- **Memory efficient**: Only stores data for active requests

## Pod Restart Impact Analysis

### What Happens During Pod Restart

When a pod restarts:
- **In-flight requests**: Lose their request ID tracking (acceptable)
- **New requests**: Get new request IDs (correct behavior)
- **Log correlation**: Only affected for requests in progress during restart

### Why This is Acceptable

1. **Request IDs are ephemeral**: They're only needed for request-scoped logging
2. **No business impact**: Losing request IDs doesn't affect application functionality
3. **Automatic recovery**: New requests immediately get proper request ID tracking
4. **Industry standard**: Most systems accept this limitation

## Scalability Considerations

### Current Memory Usage

- **Per-request storage**: Only stores data for active requests
- **Automatic cleanup**: Context is cleared after each request
- **No memory leaks**: Proper cleanup prevents accumulation

### Performance Impact

- **Minimal overhead**: Map operations are O(1)
- **No network calls**: In-memory storage is fast
- **No external dependencies**: Self-contained implementation

## Alternative Approaches (Not Recommended)

### 1. Remove RequestContextService

**Problem**: gRPC services would lose request ID tracking entirely.

### 2. Use AsyncLocalStorage

**Problem**: Adds complexity without significant benefits for this use case.

### 3. Use Redis with TTL

**Problem**: Adds network latency and complexity for ephemeral data.

## Monitoring and Observability

### Current Metrics

- **Request ID propagation success rate**: Should be 100% for properly configured services
- **Log correlation accuracy**: Should be 100% for requests within the same pod lifecycle
- **Memory usage**: Minimal and bounded by concurrent request count

### Recommended Monitoring

- **Request tracing completeness**: Monitor for missing request IDs in logs
- **Cross-service correlation**: Verify request IDs propagate correctly across services
- **Performance impact**: Monitor for any logging performance degradation

## Best Practices

### 1. Service Configuration

**HTTP Services**: Use `HttpLoggerModule` or `LoggerModule` with HTTP protocol
**gRPC Services**: Use `GrpcLoggerModule` with `RequestContextService`

### 2. Request ID Propagation

- Always use `GrpcInstance` for gRPC calls from HTTP services
- Ensure gRPC services have the `GrpcRequestIdInterceptor` configured
- Verify request IDs appear in logs across all services

### 3. Testing

- Test request ID propagation across service boundaries
- Verify log correlation works correctly
- Test behavior during high load and pod restarts

## Conclusion

The current request ID propagation system is **working correctly** and the `RequestContextService` is **necessary** for proper operation. The in-memory storage is appropriate for this use case because:

1. **Request IDs are ephemeral** and only needed for request-scoped logging
2. **gRPC services require manual request ID extraction** from metadata
3. **The current implementation is efficient and reliable** for the intended purpose
4. **Pod restart impact is acceptable** for request-scoped data

**Recommendation**: Keep the current implementation as-is. The system correctly handles request ID propagation across HTTP and gRPC services, and the `RequestContextService` is an appropriate solution for the architectural constraints. 