# Webhooks Service

## Purpose

The Webhooks service handles all external webhook integrations in the Venta backend system. It manages incoming webhook events from external services like Clerk (authentication) and RevenueCat (subscriptions), providing a centralized point for external integrations. This service serves as the communication layer between external services and our internal business logic, ensuring proper event handling and data transformation.

## Overview

This microservice provides:
- **Clerk Webhook Integration**: Handles user authentication events (user.created, user.deleted)
- **RevenueCat Webhook Integration**: Handles subscription events (INITIAL_PURCHASE, RENEWAL)
- **Event Transformation**: Converts external webhook formats to internal gRPC calls
- **Error Handling**: Robust error handling for webhook processing
- **Logging**: Comprehensive logging for webhook events and processing
- **Validation**: Webhook payload validation and security
- **Service Communication**: gRPC calls to internal services for business logic

## Architecture

### **Service Structure**
```
apps/communication/services/webhooks/
├── src/
│   ├── clerk/
│   │   ├── clerk-webhooks.controller.ts    # Clerk webhook handler
│   │   └── clerk-webhooks.module.ts        # Clerk webhook module
│   ├── revenuecat/
│   │   ├── revenuecat-webhooks.controller.ts  # RevenueCat webhook handler
│   │   └── revenuecat-webhooks.module.ts      # RevenueCat webhook module
│   └── webhooks.module.ts                  # Main webhooks module
├── tsconfig.app.json                       # TypeScript configuration
└── README.md                               # This file
```

### **Webhook Flow**
```
External Service (Clerk/RevenueCat)
         ↓
   Webhook HTTP Request
         ↓
   Webhook Controller (HTTP)
         ↓
   gRPC Call to Internal Service
         ↓
   Business Logic Processing
```

## Features

### **Clerk Webhook Integration**
- **user.created**: Handles new user registration events
- **user.deleted**: Handles user deletion events
- **Event Validation**: Validates Clerk webhook payloads
- **gRPC Communication**: Calls user-management service for business logic

### **RevenueCat Webhook Integration**
- **INITIAL_PURCHASE**: Handles new subscription purchases
- **RENEWAL**: Handles subscription renewals
- **Event Processing**: Processes subscription event data
- **User Association**: Links subscriptions to user accounts

## Configuration

### **Environment Variables**
- `USER_SERVICE_ADDRESS`: Address of the user-management gRPC service
- `CLERK_WEBHOOK_SECRET`: Secret for validating Clerk webhooks
- `REVENUECAT_WEBHOOK_SECRET`: Secret for validating RevenueCat webhooks

### **Service Dependencies**
- **User Management Service**: For user-related business logic
- **gRPC Infrastructure**: For internal service communication

## Development

### **Running the Service**
```bash
# From the project root
pnpm run start:webhooks

# Or directly
cd apps/communication/services/webhooks
pnpm run start
```

### **Testing**
```bash
# Run webhook service tests
pnpm run test:webhooks

# Run all tests
pnpm run test
```

### **Building**
```bash
# Build the service
pnpm run build:webhooks

# Build all services
pnpm run build
```

## API Endpoints

### **Clerk Webhooks**
- `POST /webhook/clerk` - Handles Clerk authentication events

### **RevenueCat Webhooks**
- `POST /webhook/revenuecat` - Handles RevenueCat subscription events

## Integration Points

### **Internal Services**
- **User Management Service**: For user creation, deletion, and subscription management
- **Event System**: For publishing domain events

### **External Services**
- **Clerk**: User authentication and management
- **RevenueCat**: Subscription and payment processing

## Security

- **Webhook Validation**: Validates webhook signatures and payloads
- **Error Handling**: Graceful handling of invalid webhook requests
- **Logging**: Comprehensive logging for security monitoring
- **Rate Limiting**: Protection against webhook spam

## Monitoring

- **Health Checks**: Service health monitoring
- **Metrics**: Webhook processing metrics
- **Logging**: Structured logging for webhook events
- **Error Tracking**: Error monitoring and alerting

## Future Enhancements

- **Additional Webhook Providers**: Support for more external services
- **Webhook Retry Logic**: Automatic retry for failed webhook processing
- **Webhook Queue**: Asynchronous webhook processing
- **Webhook Analytics**: Webhook event analytics and reporting 