# Comprehensive NATS Guide: Subjects, Streams, and Queue Groups

## Overview

This guide covers everything you need to know about using NATS with NestJS for autoscaling microservices, including subjects, streams, and queue groups for preventing duplicate processing.

## Key Concepts

### **1. Subjects (Message Routing)**
- **What they are**: NATS core pub/sub message routing mechanism
- **Examples**: `vendor.created`, `user.updated`, `payment.process`
- **In code**: Used for `natsClient.emit()` and `@MessagePattern()`

### **2. Streams (Persistence Layer)**
- **What they are**: NATS JetStream feature for message persistence and replay
- **Where configured**: On the NATS server, not in application code
- **Purpose**: Automatically capture messages based on subject patterns

### **3. Queue Groups (Load Balancing)**
- **What they are**: NATS feature that ensures only ONE instance processes each message
- **Purpose**: Prevent duplicate processing across multiple service instances
- **When to use**: Critical operations like payment processing

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Service A     │    │   Service B     │    │   Service C     │
│                 │    │                 │    │                 │
│ Emits to        │    │ Listens to      │    │ Listens to      │
│ Subjects        │    │ Subjects        │    │ Subjects        │
│                 │    │                 │    │                 │
│ vendor.created   │───▶│ vendor.created   │    │ vendor.*        │
│ user.updated     │───▶│ user.updated     │    │ *.location.*    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NATS Server                                  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   vendor    │  │     user    │  │   location  │            │
│  │   stream    │  │   stream    │  │   stream    │            │
│  │             │  │             │  │             │            │
│  │ vendor.*    │  │ user.*      │  │ *.location.*│            │
│  │ (persisted) │  │ (persisted) │  │ (persisted) │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Pattern 1: Simple Message Patterns (Current Approach)

### **How It Works**
```typescript
// Service A: Emit message
@Injectable()
export class VendorService {
  constructor(@Inject('NATS_SERVICE') private readonly natsClient: ClientProxy) {}

  async createVendor(vendorData: any) {
    // Emit to subject - streams handle persistence automatically
    this.natsClient.emit('vendor.created', {
      id: vendorData.id,
      name: vendorData.name,
      timestamp: new Date().toISOString(),
    });
  }
}

// Service B: Listen to message
@Injectable()
export class AlgoliaSyncService {
  @MessagePattern('vendor.created')
  async handleVendorCreated(@Payload() vendor: Record<string, unknown>) {
    // This might run on multiple instances, but it's safe (idempotent)
    await this.algoliaService.createObject('vendor', vendor);
  }
}
```

### **Autoscaling Behavior**
```
Instance 1: receives vendor.created → processes it
Instance 2: receives vendor.created → ALSO processes it (duplicate!)
Instance 3: receives vendor.created → ALSO processes it (duplicate!)
```

### **When to Use This Pattern**
- **Non-critical operations** where duplicates are safe
- **Idempotent operations** (can run multiple times safely)
- **Data synchronization** (Algolia sync, cache updates)
- **Notifications** (emails, SMS, push notifications)
- **Analytics** (event tracking, metrics)

### **Pros & Cons**
✅ **Pros:**
- Simple to implement
- Works with NestJS native patterns
- Good for non-critical operations

❌ **Cons:**
- Multiple instances process the same message
- Can cause duplicate processing
- Not suitable for critical operations

## Pattern 2: Queue Groups (For Critical Operations)

### **How It Works**
```typescript
// Service A: Emit message (same as before)
@Injectable()
export class OrderService {
  constructor(@Inject('NATS_SERVICE') private readonly natsClient: ClientProxy) {}

  async processPayment(paymentData: any) {
    // Emit to subject
    this.natsClient.emit('payment.process', paymentData);
  }
}

// Service B: Listen with queue group
@Injectable()
export class PaymentService {
  constructor(private readonly natsQueueService: NatsQueueService) {}

  initializePaymentQueues(): void {
    this.natsQueueService.subscribeToQueue(
      'payment.process',
      'payment-processors', // Queue group name
      this.handlePaymentProcess.bind(this)
    );
  }

  private async handlePaymentProcess(data: any): Promise<void> {
    // Only ONE instance processes this payment
    await this.processPaymentWithProvider(data);
  }
}
```

### **Autoscaling Behavior**
```
Instance 1: joins 'payment-processors' queue group
Instance 2: joins 'payment-processors' queue group  
Instance 3: joins 'payment-processors' queue group

Message arrives: 'payment.process'
→ NATS automatically routes to only ONE instance in the queue group
→ Instance 2 processes it
→ Instances 1 & 3 do NOT process it
```

### **When to Use This Pattern**
- **Critical operations** that can't tolerate duplicates
- **Payment processing** (double charging is bad!)
- **Order fulfillment** (double shipping is bad!)
- **Inventory management** (double reservation is bad!)
- **User account operations** (double suspension is bad!)

### **Pros & Cons**
✅ **Pros:**
- Guaranteed single-instance processing
- Load balancing across instances
- Perfect for critical operations

❌ **Cons:**
- More complex to implement
- Requires raw NATS client
- Overkill for non-critical operations

## How Queue Groups Prevent Duplicates

### **The Magic of Queue Groups**

When you create a subscription with a queue group:

```typescript
const subscription = nc.subscribe('payment.process', {
  queue: 'payment-processors' // This is the key!
});
```

NATS does the following:

1. **Groups subscribers**: All instances with the same queue group name form a group
2. **Load balances**: NATS automatically distributes messages among group members
3. **Guarantees single delivery**: Each message goes to exactly ONE member of the group

### **Visual Example**

```
Without Queue Groups:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Instance 1  │  │ Instance 2  │  │ Instance 3  │
│             │  │             │  │             │
│ vendor.*    │  │ vendor.*    │  │ vendor.*    │
│ (all get    │  │ (all get    │  │ (all get    │
│  same msg)  │  │  same msg)  │  │  same msg)  │
└─────────────┘  └─────────────┘  └─────────────┘

With Queue Groups:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Instance 1  │  │ Instance 2  │  │ Instance 3  │
│             │  │             │  │             │
│ payment.*   │  │ payment.*   │  │ payment.*   │
│ queue:      │  │ queue:      │  │ queue:      │
│ 'processors'│  │ 'processors'│  │ 'processors'│
└─────────────┘  └─────────────┘  └─────────────┘
                    ↑
              Only this one
              gets the message
```

## The Role of Streams and Subjects

### **Subjects: The Routing Layer**

Subjects are the **routing mechanism** used in your application code:

```typescript
// Emit to subject
this.natsClient.emit('vendor.created', data);

// Listen to subject
@MessagePattern('vendor.created')
async handleVendorCreated(@Payload() data: any) {
  // Process the message
}
```

### **Streams: The Persistence Layer**

Streams are configured on the **NATS server** and automatically capture messages:

```bash
# Configure streams on NATS server
nats stream add vendor --subjects "vendor.*" --retention workqueue
nats stream add user --subjects "user.*" --retention workqueue
nats stream add payment --subjects "payment.*" --retention workqueue
```

### **How They Work Together**

```
1. Your app emits: natsClient.emit('vendor.created', data)
2. Message goes to subject: 'vendor.created'
3. Stream 'vendor' automatically captures it (matches 'vendor.*')
4. Message is persisted for replay/recovery
5. Your app listens: @MessagePattern('vendor.created')
6. Message is delivered to your handler
```

### **Streams with Queue Groups**

```
1. Your app emits: natsClient.emit('payment.process', data)
2. Message goes to subject: 'payment.process'
3. Stream 'payment' automatically captures it (matches 'payment.*')
4. Message is persisted
5. Queue group 'payment-processors' receives the message
6. Only ONE instance in the queue group processes it
```

## Implementation Examples

### **Current Setup (Simple Patterns)**

```typescript
// apps/algolia-sync/src/algolia-sync.service.ts
@Injectable()
export class AlgoliaSyncService {
  @MessagePattern('vendor.created')
  async handleVendorCreated(@Payload() vendor: Record<string, unknown>) {
    // Safe to run on multiple instances (idempotent)
    await this.algoliaService.createObject('vendor', vendor);
  }
}
```

### **Future Setup (Queue Groups)**

```typescript
// When you add payment processing
@Injectable()
export class PaymentService {
  constructor(private readonly natsQueueService: NatsQueueService) {}

  initializePaymentQueues(): void {
    this.natsQueueService.subscribeToQueue(
      'payment.process',
      'payment-processors',
      this.handlePaymentProcess.bind(this)
    );
  }

  private async handlePaymentProcess(data: any): Promise<void> {
    // Only ONE instance processes this
    await this.processPaymentWithProvider(data);
  }
}
```

## Configuration

### **NATS Server Streams**

```bash
# Create streams for different domains
nats stream add vendor --subjects "vendor.*" --retention workqueue
nats stream add user --subjects "user.*" --retention workqueue
nats stream add payment --subjects "payment.*" --retention workqueue
nats stream add order --subjects "order.*" --retention workqueue
```

### **Application Configuration**

```typescript
// For simple patterns (current)
@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [{
        name: 'NATS_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: configService.get('NATS_URL') || 'nats://localhost:4222',
          },
        }),
        inject: [ConfigService],
      }],
    }),
  ],
})
export class AppModule {}

// For queue groups (future)
@Module({
  imports: [NatsQueueModule], // Additional module for queue groups
  providers: [PaymentService],
})
export class PaymentModule {}
```

## Decision Matrix

| Operation Type | Pattern | Reason |
|---|---|---|
| **Payment Processing** | Queue Groups | Can't tolerate duplicates |
| **Order Fulfillment** | Queue Groups | Can't ship twice |
| **Inventory Reservation** | Queue Groups | Can't reserve twice |
| **User Account Operations** | Queue Groups | Can't suspend twice |
| **Algolia Sync** | Simple Patterns | Safe to run multiple times |
| **Email Sending** | Simple Patterns | Safe to send multiple times |
| **Analytics** | Simple Patterns | Safe to track multiple times |
| **Cache Updates** | Simple Patterns | Safe to update multiple times |

## Migration Strategy

### **Phase 1: Start with Simple Patterns**
- Use `@MessagePattern` for all operations
- Make operations idempotent where possible
- Deploy and test with autoscaling

### **Phase 2: Identify Critical Operations**
- List operations that can't tolerate duplicates
- Prioritize by business impact
- Plan migration order

### **Phase 3: Implement Queue Groups**
- Add `NatsQueueModule` to critical services
- Implement queue group handlers
- Test with multiple instances

### **Phase 4: Monitor and Optimize**
- Monitor for duplicate processing
- Track queue group performance
- Optimize based on metrics

## Summary

- **Subjects**: Message routing (used in your code)
- **Streams**: Persistence layer (configured on NATS server)
- **Simple Patterns**: Multiple instances process same message (safe for non-critical ops)
- **Queue Groups**: Only one instance processes each message (required for critical ops)

Your current setup uses simple patterns for safe operations. When you add critical operations like payment processing, you can implement queue groups using the `NatsQueueService` infrastructure that's already available. 