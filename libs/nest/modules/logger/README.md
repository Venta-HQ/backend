# Logger Module

## Purpose

The Logger Module provides standardized logging capabilities across all services in the Venta backend system. It offers structured JSON logging with request context tracking, console output, and optional Loki integration for centralized log aggregation. This module ensures consistent logging patterns, proper log levels, and comprehensive request tracing throughout the application.

## Overview

This module provides:
- Structured JSON logging with consistent formatting across all services
- Request context tracking and correlation for distributed tracing
- Console logging with configurable output levels
- Optional Loki integration for centralized log aggregation
- Request ID propagation and correlation across service boundaries
- Log level management and filtering capabilities
- Performance monitoring and logging metrics

## Usage

### Module Registration

The module is automatically included via BootstrapModule in all services:

```typescript
// Automatically included in BootstrapModule.forRoot()
BootstrapModule.forRoot({
  appName: 'Your Service',
  protocol: 'grpc',
  // LoggerModule is automatically registered with service name
})
```

### Service Injection

Inject LoggerService into your services for structured logging:

```typescript
@Injectable()
export class YourService {
  constructor(private logger: LoggerService) {}

  async processData(data: any) {
    this.logger.log('Processing data', { dataId: data.id, type: data.type });
    
    try {
      const result = await this.performOperation(data);
      this.logger.log('Data processed successfully', { resultId: result.id });
      return result;
    } catch (error) {
      this.logger.error('Failed to process data', { error: error.message, dataId: data.id });
      throw error;
    }
  }
}
```

### Log Levels

Use appropriate log levels for different types of messages:

```typescript
// Info level for general information
this.logger.log('User logged in', { userId: user.id });

// Error level for errors and exceptions
this.logger.error('Database connection failed', { error: error.message });

// Debug level for detailed debugging information
this.logger.debug('Processing request', { requestId: req.id, method: req.method });
```

### Request Context

The logger automatically includes request context when available:

```typescript
// Request context is automatically included in logs
// Includes request ID, user ID, service name, and timestamp
this.logger.log('Processing user request', { action: 'update_profile' });
```

### Structured Logging Output

Logs are output in structured JSON format:

```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "user-service",
  "requestId": "req_123456789",
  "userId": "user_123",
  "metadata": {
    "action": "login",
    "method": "POST"
  }
}
```

### Environment Configuration

Configure logging behavior and Loki integration:

```env
# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Loki Integration (optional)
LOKI_URL=http://localhost:3100
LOKI_BATCH_SIZE=100
LOKI_BATCH_INTERVAL=5000
```

## Key Benefits

- **Structured Logging**: Consistent JSON format across all services
- **Request Tracing**: Automatic request ID propagation and correlation
- **Centralized Aggregation**: Optional Loki integration for log management
- **Performance Optimized**: Efficient logging with minimal overhead
- **Context Awareness**: Automatic inclusion of request and service context
- **Configurable Levels**: Flexible log level management and filtering

## Dependencies

- **NestJS Logger** for base logging functionality
- **Request Context Service** for request tracking and correlation
- **Loki Transport** (optional) for centralized log aggregation
