# 📚 API Documentation Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Documentation Standards](#documentation-standards)
- [Implementation Guidelines](#implementation-guidelines)
- [gRPC Documentation](#grpc-documentation)
- [WebSocket Documentation](#websocket-documentation)
- [Documentation Best Practices](#documentation-best-practices)
- [Documentation Maintenance](#documentation-maintenance)

## 🎯 Overview

This guide outlines the **standards and best practices** for documenting APIs in the Venta Backend project. Consistent and comprehensive API documentation is crucial for developer experience, integration, and maintenance.

## 📝 Documentation Standards

### **1. OpenAPI/Swagger Specification**

All REST APIs should be documented using **OpenAPI 3.0 specification**. This provides:

| Feature | Benefit |
|---------|---------|
| **Interactive API documentation** | Visual exploration of endpoints |
| **Code generation capabilities** | Auto-generate client SDKs |
| **Automated testing support** | Test API contracts |
| **Client SDK generation** | Generate client libraries |

### **2. Documentation Structure**

Each service should include:

| Component | Description |
|-----------|-------------|
| **API Overview** | Purpose and capabilities |
| **Authentication** | How to authenticate requests (Bearer tokens, webhook signatures) |
| **Endpoints** | Complete endpoint documentation with examples |
| **Data Models** | Request/response schemas with validation |
| **Error Handling** | Error codes and response formats |

## 💻 Implementation Guidelines

### **1. NestJS Swagger Integration**

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Venta API')
    .setDescription('The Venta API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
```

### **2. Controller Documentation**

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('webhook/clerk')
  @ApiOperation({ summary: 'Handle Clerk user creation webhook' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully',
    type: ClerkWebhookResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid webhook data' 
  })
  @ApiSecurity('webhook_signature')
  async handleClerkWebhook(@Body() clerkData: ClerkWebhookDataDto): Promise<ClerkWebhookResponseDto> {
    return this.userService.handleClerkUserCreated(clerkData);
  }

  @Post('webhook/revenuecat')
  @ApiOperation({ summary: 'Handle RevenueCat subscription webhook' })
  @ApiResponse({ 
    status: 200, 
    description: 'Subscription processed successfully',
    type: SubscriptionResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - invalid subscription data' 
  })
  @ApiSecurity('webhook_signature')
  async handleRevenueCatWebhook(@Body() subscriptionData: RevenueCatDataDto): Promise<SubscriptionResponseDto> {
    return this.userService.handleSubscriptionCreated(subscriptionData);
  }
}
```

### **3. DTO Documentation**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class ClerkWebhookDataDto {
  @ApiProperty({
    description: 'Clerk user ID',
    example: 'user_2abc123def456',
  })
  @IsString()
  id: string;
}

export class RevenueCatDataDto {
  @ApiProperty({
    description: 'Clerk user ID',
    example: 'user_2abc123def456',
  })
  @IsString()
  clerkUserId: string;

  @ApiProperty({
    description: 'RevenueCat provider ID',
    example: 'provider_123',
  })
  @IsString()
  providerId: string;
}

export class ClerkWebhookResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'User created successfully'
  })
  message: string;
}

export class SubscriptionResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Subscription created successfully'
  })
  message: string;
}
```

### **4. Error Response Documentation**

```typescript
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Error code',
    example: 'USER_NOT_FOUND'
  })
  code: string;

  @ApiProperty({
    description: 'Error message',
    example: 'User with the specified ID was not found'
  })
  message: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 404
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2024-01-01T00:00:00.000Z'
  })
  timestamp: string;
}
```

## 📡 gRPC Documentation

### **1. Protocol Buffer Documentation**

```protobuf
syntax = "proto3";

package venta.user;

import "google/protobuf/timestamp.proto";

// User service provides user management functionality
service UserService {
  // CreateUser creates a new user account
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
  
  // GetUser retrieves a user by their ID
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  
  // UpdateUser updates an existing user's information
  rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);
}

// CreateUserRequest contains the data needed to create a new user
message CreateUserRequest {
  // User's full name (required)
  string name = 1;
  
  // User's email address (required, must be unique)
  string email = 2;
  
  // User's phone number (optional)
  optional string phone = 3;
}

// CreateUserResponse contains the created user information
message CreateUserResponse {
  // Created user object
  User user = 1;
}

// GetUserRequest contains the user ID to retrieve
message GetUserRequest {
  // Unique user identifier
  string user_id = 1;
}

// GetUserResponse contains the requested user information
message GetUserResponse {
  // User object
  User user = 1;
}

// User represents a user account
message User {
  // Unique user identifier
  string id = 1;
  
  // User's full name
  string name = 2;
  
  // User's email address
  string email = 3;
  
  // User's phone number
  optional string phone = 4;
  
  // When the user was created
  google.protobuf.Timestamp created_at = 5;
  
  // When the user was last updated
  google.protobuf.Timestamp updated_at = 6;
}
```

### **2. gRPC Service Documentation**

```typescript
import { GrpcMethod } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  /**
   * Creates a new user account
   * @param request - User creation data
   * @returns Created user information
   * @throws {AppError} When email already exists
   */
  @GrpcMethod('UserService', 'CreateUser')
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    // Implementation
  }

  /**
   * Retrieves a user by their ID
   * @param request - Contains user ID
   * @returns User information
   * @throws {AppError} When user not found
   */
  @GrpcMethod('UserService', 'GetUser')
  async getUser(request: GetUserRequest): Promise<GetUserResponse> {
    // Implementation
  }
}
```

## 🔌 WebSocket Documentation

### **1. Event Documentation**

```typescript
import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';

@WebSocketGateway({
  namespace: 'location',
  cors: {
    origin: '*',
  },
})
export class LocationGateway {
  /**
   * Handles user location updates
   * 
   * @event user:location:update
   * @param data - Location update data
   * @returns Acknowledgement of location update
   * 
   * @example
   * // Client sends:
   * socket.emit('user:location:update', {
   *   latitude: 37.7749,
   *   longitude: -122.4194,
   *   timestamp: '2024-01-01T00:00:00.000Z'
   * });
   * 
   * // Server responds:
   * { success: true, message: 'Location updated' }
   */
  @SubscribeMessage('user:location:update')
  handleLocationUpdate(@MessageBody() data: LocationUpdateDto) {
    // Implementation
  }

  /**
   * Subscribes to vendor location updates
   * 
   * @event vendor:location:subscribe
   * @param data - Subscription data
   * @returns Subscription confirmation
   * 
   * @example
   * // Client sends:
   * socket.emit('vendor:location:subscribe', {
   *   vendorId: 'vendor-123',
   *   radius: 5000 // meters
   * });
   * 
   * // Server responds:
   * { success: true, subscriptionId: 'sub-456' }
   */
  @SubscribeMessage('vendor:location:subscribe')
  handleVendorSubscription(@MessageBody() data: VendorSubscriptionDto) {
    // Implementation
  }
}
```

## 🎯 Documentation Best Practices

### **1. Content Guidelines**

| Guideline | Description | Example |
|-----------|-------------|---------|
| **Be Clear and Concise** | Use simple, clear language | "Creates a new user account" |
| **Provide Examples** | Include realistic request/response examples | Show actual JSON payloads |
| **Document Errors** | List all possible error responses | Include error codes and messages |
| **Keep Updated** | Maintain documentation with code changes | Update docs with each release |
| **Use Consistent Formatting** | Follow established patterns | Use consistent naming conventions |

### **2. API Versioning**

```typescript
// Version your APIs explicitly
@Controller({ path: 'users', version: '1' })
export class UserControllerV1 {
  // V1 endpoints
}

@Controller({ path: 'users', version: '2' })
export class UserControllerV2 {
  // V2 endpoints with breaking changes
}
```

### **3. Authentication Documentation**

```typescript
// Document authentication requirements
@ApiBearerAuth()
@ApiSecurity('api_key')
@Controller('users')
export class UserController {
  @Post()
  @ApiOperation({ 
    summary: 'Create user',
    description: 'Creates a new user account. Requires authentication.'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing authentication token' 
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Implementation
  }
}
```

### **4. Rate Limiting Documentation**

```typescript
// Document rate limiting
@Throttle(10, 60) // 10 requests per minute
@Controller('users')
export class UserController {
  @Post()
  @ApiOperation({ 
    summary: 'Create user',
    description: 'Rate limited to 10 requests per minute per IP'
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too Many Requests - Rate limit exceeded' 
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Implementation
  }
}
```

## 🔄 Documentation Maintenance

### **1. Automated Documentation**

```typescript
// Generate documentation automatically
import { writeFileSync } from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function generateDocs() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Venta API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Save to file
  writeFileSync('./docs/api-spec.json', JSON.stringify(document, null, 2));
  
  await app.close();
}
```

### **2. Documentation Review Process**

| Step | Description | Owner |
|------|-------------|-------|
| **Code Review** | Include documentation in code reviews | Developer |
| **Testing** | Test documentation examples | QA Engineer |
| **Validation** | Validate OpenAPI specifications | DevOps Engineer |
| **Updates** | Update documentation with each release | Technical Writer |

### **3. Documentation Tools**

| Tool | Purpose | Use Case |
|------|---------|----------|
| **Swagger UI** | Interactive API documentation | Developer exploration |
| **Postman** | API testing and documentation | API testing |
| **Insomnia** | API design and testing | API development |
| **OpenAPI Generator** | Code generation from specs | Client SDK generation |

## 📁 Example Documentation Structure

```
docs/
├── 📁 api/
│   ├── 📁 gateway/
│   │   ├── 📄 README.md
│   │   ├── 📄 openapi.json
│   │   └── 📁 examples/
│   ├── 📁 user/
│   │   ├── 📄 README.md
│   │   ├── 📄 openapi.json
│   │   └── 📁 examples/
│   └── 📁 vendor/
│       ├── 📄 README.md
│       ├── 📄 openapi.json
│       └── 📁 examples/
├── 📁 grpc/
│   ├── 📄 user.proto
│   ├── 📄 vendor.proto
│   └── 📄 location.proto
└── 📁 websocket/
    ├── 📄 events.md
    └── 📁 examples/
```

## 📊 API Documentation Checklist

### **For Each Endpoint**

- [ ] **Clear description** of what the endpoint does
- [ ] **Request/response examples** with realistic data
- [ ] **Authentication requirements** documented
- [ ] **Rate limiting** information included
- [ ] **Error responses** documented with codes
- [ ] **Validation rules** clearly stated
- [ ] **Dependencies** on other services noted

### **For Each Service**

- [ ] **Service overview** and purpose
- [ ] **Authentication methods** supported
- [ ] **Rate limiting** policies
- [ ] **Error handling** strategies
- [ ] **Versioning** approach
- [ ] **Deprecation** policies
- [ ] **Migration guides** for breaking changes

## 🔧 OpenAPI Specification Examples

### **Complete API Specification**

```yaml
openapi: 3.0.0
info:
  title: Venta API
  description: API for Venta backend services
  version: 1.0.0
  contact:
    name: API Support
    email: api@venta.com

servers:
  - url: https://api.venta.com/v1
    description: Production server
  - url: https://staging-api.venta.com/v1
    description: Staging server

paths:
  /users/webhook/clerk:
    post:
      summary: Handle Clerk user creation webhook
      description: Processes user creation events from Clerk
      tags:
        - users
      security:
        - webhook_signature: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ClerkWebhookData'
            example:
              id: "user_2abc123def456"
              email: "user@example.com"
      responses:
        '200':
          description: Webhook processed successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ClerkWebhookResponse'
        '400':
          description: Bad request - invalid webhook data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  schemas:
    ClerkWebhookData:
      type: object
      required:
        - id
      properties:
        id:
          type: string
          description: Clerk user ID
          example: "user_2abc123def456"
    
    ClerkWebhookResponse:
      type: object
      properties:
        message:
          type: string
          description: Response message
          example: "User created successfully"
    
    ErrorResponse:
      type: object
      properties:
        code:
          type: string
          description: Error code
          example: "INVALID_WEBHOOK_DATA"
        message:
          type: string
          description: Error message
          example: "Invalid webhook data provided"
        statusCode:
          type: integer
          description: HTTP status code
          example: 400
        timestamp:
          type: string
          format: date-time
          description: Timestamp when the error occurred
          example: "2024-01-01T00:00:00.000Z"

  securitySchemes:
    webhook_signature:
      type: apiKey
      name: x-webhook-signature
      in: header
      description: Webhook signature for verification
```

## 🎯 Documentation Quality Metrics

### **Documentation Coverage**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Endpoint Coverage** | 100% | All endpoints documented |
| **Example Coverage** | 90% | Most endpoints have examples |
| **Error Documentation** | 100% | All error responses documented |
| **Schema Coverage** | 100% | All DTOs have schemas |

### **Documentation Quality**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Clarity Score** | > 4.5/5 | User feedback on clarity |
| **Completeness** | > 95% | Coverage of all features |
| **Accuracy** | > 99% | Documentation matches implementation |
| **Timeliness** | < 24h | Updates within 24 hours of code changes |

---

**This API documentation guide ensures consistent, comprehensive, and maintainable API documentation across all services in the Venta Backend project.** 