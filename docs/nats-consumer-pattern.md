# 🔄 NATS Consumer Pattern

## 📋 Table of Contents

- [Overview](#overview)
- [Automatic Correlation ID Extraction](#automatic-correlation-id-extraction)
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
Use the `NatsRequestIdInterceptor` to automatically extract correlation IDs:

```typescript
// ✅ Automatic approach (scalable)
@UseInterceptors(NatsRequestIdInterceptor)
export class YourNatsConsumer {
  private async handleVendorEvent(data: { data: BaseEvent; subject: string }): Promise<void> {
    const { data: event, subject } = data;
    
    // Correlation ID automatically available in logs
    this.logger.log(`Handling ${subject} event: ${event.eventId}`);
    // ...
  }
}
```

## 🏗️ Implementation Pattern

### **1. Basic Pattern**

```typescript
import { Injectable, Logger, OnModuleInit, UseInterceptors } from '@nestjs/common';
import { NatsQueueService, NatsRequestIdInterceptor } from '@app/nest/modules';

@Injectable()
@UseInterceptors(NatsRequestIdInterceptor)
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

### **2. Using the Base Class (Optional)**

For even more consistency, you can extend the `NatsConsumerBase`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { NatsQueueService, NatsConsumerBase } from '@app/nest/modules';

@Injectable()
export class YourNatsConsumer extends NatsConsumerBase implements OnModuleInit {
  constructor(
    private readonly natsQueueService: NatsQueueService,
    private readonly yourService: YourService,
  ) {
    super();
  }

  async onModuleInit() {
    this.natsQueueService.subscribeToQueue(
      'your.subject.>',
      'your-queue-group',
      this.handleMessage.bind(this),
    );
  }

  protected async handleMessage(data: any): Promise<void> {
    // Correlation ID automatically available in logs
    this.logger.log('Processing message', { messageId: data.id });
    await this.yourService.process(data);
  }
}
```

## 📝 Usage Examples

### **Example 1: Event Processing Consumer**

```typescript
@Injectable()
@UseInterceptors(NatsRequestIdInterceptor)
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
@UseInterceptors(NatsRequestIdInterceptor)
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

### **1. Automatic Correlation ID Extraction**
- **No manual correlation ID handling** required
- **Consistent across all NATS consumers**
- **Automatic logger integration**

### **2. Scalable Pattern**
- **Easy to apply to new consumers**
- **Consistent implementation across services**
- **Reduced boilerplate code**

### **3. Complete Request Tracing**
- **Correlation IDs automatically available in logs**
- **End-to-end request tracing**
- **Easy debugging and monitoring**

### **4. Production Ready**
- **Error handling included**
- **Request context cleanup**
- **Structured logging**

## 🔧 Configuration

### **Module Registration**

The interceptor is automatically available when you import from `@app/nest/modules`:

```typescript
import { NatsRequestIdInterceptor } from '@app/nest/modules';
```

### **Automatic Features**

When you use `@UseInterceptors(NatsRequestIdInterceptor)`:

1. **Correlation ID Extraction**: Automatically extracts from message data
2. **Request Context**: Sets correlation ID in RequestContextService
3. **Logger Integration**: Makes correlation ID available to all log messages
4. **Context Cleanup**: Automatically clears context after processing
5. **Error Handling**: Ensures context cleanup even on errors

## 🎯 Best Practices

### **1. Always Use the Interceptor**
```typescript
// ✅ Do this
@UseInterceptors(NatsRequestIdInterceptor)
export class YourConsumer { }

// ❌ Don't do this
export class YourConsumer {
  // Manual correlation ID handling
}
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

This pattern ensures that all NATS consumers in your system have consistent, automatic correlation ID handling without any manual intervention required. 