# 🔌 Venta API Documentation

## Overview

This document provides comprehensive documentation for Venta's API endpoints. The API is organized by domain and follows RESTful principles.

## 🔑 Authentication

All API endpoints require authentication using Clerk. Include the authentication token in the Authorization header:

```http
Authorization: Bearer <token>
```

## 🏪 Marketplace Domain

### User

#### Get User Vendors

```http
GET /user/vendors
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

### Vendor

#### Get Vendor Profile

```http
GET /vendor/:id
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
PUT /vendor/:id
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

#### Create Vendor

```http
POST /vendor
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

### WebSockets

#### Location Gateway (current)

- Namespace: `/vendor`
- Auth: Bearer token required
- Query params: `vendorId` (required for vendor connections)

Client → Server:

- `update_location` `{ lat: number; lng: number }`

Server → Client:

- `vendor_status_changed` `{ vendorId: string; isOnline: boolean }`
- `vendor_location_changed` `{ vendorId: string; location: { lat: number; lng: number } }`
- `location_updated` `{ vendorId: string; coordinates: { lat: number; lng: number } }`

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

#### Upload Image (Avatar)

```http
POST /upload/image
```

**Request**

- Content-Type: multipart/form-data
- Body: file

**Response**

```json
{
  "url": "string",
  "publicId": "string",
  "bytes": number,
  "format": "string"
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

API endpoints may be rate limited depending on environment configuration.

Rate limit headers (when enabled):

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
