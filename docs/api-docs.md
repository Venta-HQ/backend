# 🔌 Venta API Documentation

## Overview

This document provides comprehensive documentation for Venta's API endpoints. The API is organized by domain and follows RESTful principles.

## 🔑 Authentication

All API endpoints require authentication using Clerk. Include the authentication token in the Authorization header:

```http
Authorization: Bearer <token>
```

## 🏪 Marketplace Domain

### User Management

#### Get Current User

```http
GET /api/users/me
```

**Response**

```json
{
  "id": "string",
  "email": "string",
  "profile": {
    "name": "string",
    "preferences": {
      "notificationSettings": {
        "email": boolean,
        "push": boolean
      },
      "searchRadius": number
    }
  }
}
```

#### Update User Preferences

```http
PUT /api/users/preferences
```

**Request Body**

```json
{
  "notificationSettings": {
    "email": boolean,
    "push": boolean
  },
  "searchRadius": number
}
```

### Vendor Management

#### Get Vendor Profile

```http
GET /api/vendors/:id
```

**Response**

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "location": {
    "lat": number,
    "lng": number
  },
  "status": "active" | "inactive",
  "subscriptionStatus": "free" | "premium"
}
```

#### Update Vendor Profile

```http
PUT /api/vendors/:id
```

**Request Body**

```json
{
  "name": "string",
  "description": "string",
  "location": {
    "lat": number,
    "lng": number
  }
}
```

#### Update Vendor Status

```http
PUT /api/vendors/:id/status
```

**Request Body**

```json
{
  "status": "active" | "inactive"
}
```

### Search & Discovery

#### Search Vendors

```http
GET /api/search/vendors
```

**Query Parameters**

- `query`: Search text
- `lat`: Latitude
- `lng`: Longitude
- `radius`: Search radius in meters

**Response**

```json
{
  "vendors": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "location": {
        "lat": number,
        "lng": number
      },
      "distance": number
    }
  ]
}
```

## 📍 Location Services Domain

### Geolocation

#### Update Location

```http
PUT /api/location
```

**Request Body**

```json
{
  "lat": number,
  "lng": number,
  "accuracy": number
}
```

#### Get Nearby Vendors

```http
GET /api/location/nearby
```

**Query Parameters**

- `lat`: Latitude
- `lng`: Longitude
- `radius`: Search radius in meters

**Response**

```json
{
  "vendors": [
    {
      "id": "string",
      "name": "string",
      "location": {
        "lat": number,
        "lng": number
      },
      "distance": number
    }
  ]
}
```

### Real-time

#### WebSocket Connection

```websocket
WS /ws
```

**Connection Parameters**

- `token`: Authentication token

**Events**

Vendor Location Update:

```json
{
  "type": "vendor_location_updated",
  "data": {
    "vendorId": "string",
    "location": {
      "lat": number,
      "lng": number
    },
    "timestamp": "string"
  }
}
```

Proximity Alert:

```json
{
  "type": "proximity_alert",
  "data": {
    "vendorId": "string",
    "distance": number,
    "timestamp": "string"
  }
}
```

## 💬 Communication Domain

### Webhooks

#### Clerk Webhook

```http
POST /webhooks/clerk
```

**Headers**

- `svix-id`: Webhook ID
- `svix-timestamp`: Webhook timestamp
- `svix-signature`: Webhook signature

**Events**

- `user.created`
- `user.updated`
- `user.deleted`

#### RevenueCat Webhook

```http
POST /webhooks/revenuecat
```

**Headers**

- `X-RevenueCat-Signature`: Webhook signature

**Events**

- `subscription_started`
- `subscription_renewed`
- `subscription_cancelled`

## 🔧 Infrastructure Domain

### File Management

#### Upload File

```http
POST /api/files/upload
```

**Request**

- Content-Type: multipart/form-data
- Body: file

**Response**

```json
{
  "url": "string",
  "filename": "string",
  "size": number,
  "mimeType": "string"
}
```

## 🚨 Error Handling

All API endpoints use standard HTTP status codes and return errors in the following format:

```json
{
  "type": "VALIDATION" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL",
  "code": "string",
  "message": "string",
  "context": {
    "field": "string",
    "value": "any",
    "domain": "string",
    "operation": "string"
  }
}
```

Common Error Codes:

- `INVALID_INPUT`: Invalid request data
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Permission denied
- `INTERNAL_ERROR`: Server error

## 📊 Rate Limiting

API endpoints are rate limited:

- Standard: 100 requests per minute
- WebSocket: 60 messages per minute
- File Upload: 10 uploads per minute

Rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1625097600
```

## 🔄 Pagination

List endpoints support pagination using cursor-based pagination:

**Request**

```http
GET /api/resources?limit=10&cursor=string
```

**Response**

```json
{
  "items": [],
  "nextCursor": "string",
  "hasMore": boolean
}
```

## 📝 Request/Response Headers

### Standard Headers

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
```

### Context Headers

```http
X-Request-ID: string      # Unique request identifier
X-Correlation-ID: string  # Links related requests
X-Trace-ID: string       # OpenTelemetry trace ID
```

### Response Headers

```http
X-Request-ID: string      # Echo of request ID
X-Correlation-ID: string  # Echo of correlation ID
X-Trace-ID: string       # Echo of trace ID
X-Response-Time: number   # Processing time in ms
```

For detailed information about request context and tracing, see the [Request Context Guide](./request-context-guide.md).

## 🔒 Security

- All endpoints use HTTPS
- Authentication via Clerk
- CORS configured for approved domains
- Rate limiting per endpoint
- Request validation
- Input sanitization

## 📚 Additional Resources

- [Architecture Guide](./architecture-guide.md)
- [Developer Guide](./developer-guide.md)
- [Testing Guide](./testing-guide.md)
- [Monitoring Guide](./monitoring-guide.md)
