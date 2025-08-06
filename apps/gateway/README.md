# Gateway Service

## Purpose

The Gateway service serves as the main entry point for all HTTP requests to the Venta backend system. It handles request routing, authentication, rate limiting, and provides a unified API interface for external clients. This service acts as the front-facing layer that manages incoming requests and routes them to the appropriate microservices while providing cross-cutting concerns like security, monitoring, and request validation.

## Overview

This service provides:
- Unified HTTP API gateway for all external client requests
- Request routing and load balancing to appropriate microservices
- Authentication and authorization with Clerk integration
- Rate limiting and request throttling for API protection
- Request/response transformation and validation
- Error handling and standardized error responses
- API documentation and OpenAPI/Swagger integration
- Health checks and service status monitoring
- Request logging and monitoring with metrics collection

## Key Responsibilities

- **Request Routing**: Routes incoming HTTP requests to appropriate microservices
- **Authentication**: Validates user authentication and session management
- **Rate Limiting**: Implements request throttling and rate limiting policies
- **Request Validation**: Validates incoming requests and data formats
- **Error Handling**: Provides consistent error responses and status codes
- **Monitoring**: Tracks request metrics, performance, and health status
- **Security**: Implements security headers, CORS, and request sanitization
- **Load Balancing**: Distributes requests across service instances

## Architecture

The service follows an API gateway pattern, where it acts as the single entry point for all client requests and handles cross-cutting concerns before routing to appropriate microservices.

### Service Structure

```
Gateway Service
├── Controllers (HTTP)
│   ├── User Controller - User-related HTTP endpoints
│   ├── Vendor Controller - Vendor-related HTTP endpoints
│   ├── Upload Controller - File upload endpoints
│   └── Webhook Controllers - External webhook endpoints
├── Router Configuration
│   └── Service routing and load balancing
└── Module Configuration
    └── BootstrapModule - Standardized service bootstrapping
```

## Usage

### Starting the Service

```bash
# Development mode
pnpm run start:dev gateway

# Production mode
pnpm run start:prod gateway

# With Docker
docker-compose up gateway
```

### Environment Configuration

```env
# Service Configuration
GATEWAY_SERVICE_PORT=3000
GATEWAY_HEALTH_PORT=3010

# Authentication
CLERK_SECRET_KEY=your-clerk-secret
CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key

# Rate Limiting
GATEWAY_RATE_LIMIT_REQUESTS=100
GATEWAY_RATE_LIMIT_WINDOW=60000

# CORS
GATEWAY_CORS_ORIGIN=http://localhost:3000

# External Services
USER_SERVICE_ADDRESS=localhost:5000
VENDOR_SERVICE_ADDRESS=localhost:5005
LOCATION_SERVICE_ADDRESS=localhost:5001

# File Upload
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Service Patterns

The service follows these patterns:

- **API Gateway**: Acts as the single entry point for all HTTP requests
- **Request Routing**: Routes requests to appropriate microservices
- **Authentication**: Validates user sessions and permissions
- **Rate Limiting**: Implements request throttling and protection
- **Error Handling**: Provides consistent error responses
- **Request Validation**: Validates incoming data and formats
- **Monitoring**: Tracks performance metrics and health status

### Integration Points

- **User Service**: Routes user-related requests and operations
- **Vendor Service**: Routes vendor-related requests and operations
- **Location Service**: Routes location-related requests and operations
- **Clerk**: Handles authentication and user session management
- **Cloudinary**: Manages file uploads and media processing
- **WebSocket Gateway**: Provides real-time communication capabilities

## Dependencies

- **BootstrapModule** for standardized service configuration
- **ClerkModule** for authentication and user management
- **RedisModule** for session management and caching
- **ThrottlerModule** for rate limiting and request throttling
- **RouterModule** for request routing and load balancing 