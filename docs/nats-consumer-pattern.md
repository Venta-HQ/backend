# 🔄 NATS Consumer Pattern

## 📋 Table of Contents

- [Overview](#overview)
- [Automatic Correlation ID Extraction](#automatic-correlation-id-extraction)
- [App-Level Interceptor Configuration](#app-level-interceptor-configuration)
- [Implementation Pattern](#implementation-pattern)
- [Usage Examples](#usage-examples)
- [Benefits](#benefits)

## 🎯 Overview

This document describes the standardized pattern for implementing NATS consumers in the Venta backend system. The pattern ensures automatic correlation ID extraction and propagation, making request tracing consistent across all NATS-based services.

## 🔗 Automatic Correlation ID Extraction

### **The Problem**
Previously, each NATS consumer had to manually extract correlation IDs from messages and set them in the RequestContextService:

```typescript
// ❌ Manual approach (not scalable)
private async handleVendorEvent(data: { data: BaseEvent; subject: string }): Promise<void> {
  const { data: event, subject } = data;
  
  // Manual correlation ID extraction
  if (event.correlationId) {
    this.requestContextService.set('correlationId', event.correlationId);
  }
  
  this.logger.log(`Handling ${subject} event: ${event.eventId}`);
  // ...
}
```

### **The Solution**
The `NatsRequestIdInterceptor` is automatically applied at the app level for all NATS consumers:

```typescript
// ✅ Automatic approach (app-level)
@Injectable()
export class YourNatsConsumer {
  private async handleVendorEvent(data: { data: BaseEvent; subject: string }): Promise<void> {
    const { data: event, subject } = data;
    
    // Correlation ID automatically available in logs
    this.logger.log(`Handling ${subject} event: ${event.eventId}`);
    // ...
  }
}
```

## 🏗️ App-Level Interceptor Configuration

### **Automatic Configuration**

The `BootstrapModule` automatically configures the appropriate interceptor based on the protocol:

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'Your Service',
      protocol: 'nats', // ← This automatically includes NatsRequestIdInterceptor
    }),
  ],
})
export class YourModule {}
```

### **How It Works**

1. **Protocol Detection**: `BootstrapModule` detects the protocol type
2. **Interceptor Registration**: Automatically registers the appropriate interceptor as `APP_INTERCEPTOR`
3. **Global Application**: The interceptor applies to all controllers in the module
4. **Automatic Extraction**: Correlation IDs are automatically extracted from all NATS messages

## 🏗️ Implementation Pattern

### **1. Basic Pattern (No Manual Configuration Required)**

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NatsQueueService } from '@app/nest/modules';

@Injectable()
export class YourNatsConsumer implements OnModuleInit {
  private readonly logger = new Logger(YourNatsConsumer.name);

  constructor(
    private readonly natsQueueService: NatsQueueService,
    private readonly yourService: YourService,
  ) {}

  async onModuleInit() {
    this.natsQueueService.subscribeToQueue(
      'your.subject.>',
      'your-queue-group',
      this.handleMessage.bind(this),
    );
  }

  private async handleMessage(data: any): Promise<void> {
    // Correlation ID automatically available in logs
    this.logger.log('Processing message', { messageId: data.id });
    
    try {
      await this.yourService.process(data);
      this.logger.log('Message processed successfully');
    } catch (error) {
      this.logger.error('Failed to process message', error);
      throw error;
    }
  }
}
```

### **2. Module Configuration**

```typescript
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'Your Service',
      protocol: 'nats', // ← Automatically includes NatsRequestIdInterceptor
      additionalModules: [
        // Your other modules
      ],
    }),
  ],
  controllers: [YourNatsConsumer],
  providers: [YourService],
})
export class YourModule {}
```

## 📝 Usage Examples

### **Example 1: Event Processing Consumer**

```typescript
@Injectable()
export class EventProcessorController implements OnModuleInit {
  private readonly logger = new Logger(EventProcessorController.name);

  constructor(
    private readonly natsQueueService: NatsQueueService,
    private readonly eventProcessorService: EventProcessorService,
  ) {}

  async onModuleInit() {
    this.natsQueueService.subscribeToQueue(
      'events.>',
      'event-processors',
      this.handleEvent.bind(this),
    );
  }

  private async handleEvent(data: { data: BaseEvent; subject: string }): Promise<void> {
    const { data: event, subject } = data;
    
    // Correlation ID automatically available
    this.logger.log(`Processing ${subject} event: ${event.eventId}`);
    
    await this.eventProcessorService.process(event, subject);
    this.logger.log(`Successfully processed ${subject} event`);
  }
}
```

### **Example 2: Notification Consumer**

```typescript
@Injectable()
export class NotificationController implements OnModuleInit {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly natsQueueService: NatsQueueService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    this.natsQueueService.subscribeToQueue(
      'notifications.>',
      'notification-workers',
      this.handleNotification.bind(this),
    );
  }

  private async handleNotification(data: NotificationData): Promise<void> {
    // Correlation ID automatically available
    this.logger.log(`Sending notification to ${data.userId}`);
    
    await this.notificationService.send(data);
    this.logger.log(`Notification sent successfully`);
  }
}
```

## ✅ Benefits

### **1. Zero Configuration Required**
- **No manual interceptor setup** needed
- **Automatic correlation ID extraction** for all NATS consumers
- **Consistent across all services**

### **2. Scalable Pattern**
- **Works for any NATS consumer** automatically
- **No boilerplate code** required
- **Consistent implementation** across services

### **3. Complete Request Tracing**
- **Correlation IDs automatically available** in all logs
- **End-to-end request tracing**
- **Easy debugging and monitoring**

### **4. Production Ready**
- **Error handling included**
- **Request context cleanup**
- **Structured logging**

## 🔧 Configuration

### **Automatic Features**

When you use `protocol: 'nats'` in `BootstrapModule.forRoot()`:

1. **Correlation ID Extraction**: Automatically extracts from all NATS messages
2. **Request Context**: Sets correlation ID in RequestContextService
3. **Logger Integration**: Makes correlation ID available to all log messages
4. **Context Cleanup**: Automatically clears context after processing
5. **Error Handling**: Ensures context cleanup even on errors

### **No Manual Configuration Required**

```typescript
// ✅ Just specify the protocol - everything else is automatic
BootstrapModule.forRoot({
  appName: 'Your Service',
  protocol: 'nats', // ← That's it!
})
```

## 🎯 Best Practices

### **1. Always Use the BootstrapModule**
```typescript
// ✅ Do this
@Module({
  imports: [
    BootstrapModule.forRoot({
      appName: 'Your Service',
      protocol: 'nats',
    }),
  ],
})

// ❌ Don't manually configure interceptors
@Module({
  imports: [
    // Manual interceptor configuration
  ],
})
```

### **2. Consistent Logging**
```typescript
// ✅ Correlation ID automatically included
this.logger.log('Processing message');

// ❌ No need to manually pass correlation ID
this.logger.log('Processing message', { correlationId: event.correlationId });
```

### **3. Error Handling**
```typescript
// ✅ Let the interceptor handle context cleanup
try {
  await this.service.process(data);
} catch (error) {
  this.logger.error('Processing failed', error);
  throw error; // Interceptor will clean up context
}
```

## 🔄 Protocol Comparison

| Protocol | Interceptor | Configuration | Automatic |
|----------|-------------|---------------|-----------|
| **HTTP** | Pino HTTP | `protocol: 'http'` | ✅ Yes |
| **gRPC** | `GrpcRequestIdInterceptor` | `protocol: 'grpc'` | ✅ Yes |
| **NATS** | `NatsRequestIdInterceptor` | `protocol: 'nats'` | ✅ Yes |

This pattern ensures that **all NATS consumers** in your system have consistent, automatic correlation ID handling with **zero manual configuration required**. 