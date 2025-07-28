# API Documentation

## Overview

The Venta Backend provides a comprehensive API through multiple protocols:

- **HTTP Gateway** (Port 5002): REST API for client applications
- **gRPC Services**: Internal service-to-service communication
- **WebSocket Gateway** (Port 5004): Real-time bidirectional communication

## HTTP Gateway API

### Base URL

```
http://localhost:5002
```

### Authentication

All API endpoints require authentication using Clerk JWT tokens:

```bash
Authorization: Bearer <jwt_token>
```

### Vendor Endpoints

#### Get Vendor by ID

```http
GET /vendor/:id
```

**Response:**

```json
{
	"id": "vendor-123",
	"name": "Sample Vendor",
	"description": "A sample vendor",
	"phone": "+1234567890",
	"email": "contact@samplevendor.com",
	"website": "https://samplevendor.com",
	"open": true,
	"primaryImage": "https://example.com/image.jpg",
	"lat": 40.7128,
	"long": -74.006,
	"createdAt": "2024-01-15T10:30:00.000Z",
	"updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Create Vendor

```http
POST /vendor
Content-Type: application/json

{
  "name": "New Vendor",
  "description": "A new vendor",
  "phone": "+1234567890",
  "email": "contact@newvendor.com",
  "website": "https://newvendor.com",
  "lat": 40.7128,
  "long": -74.0060
}
```

#### Update Vendor

```http
PUT /vendor/:id
Content-Type: application/json

{
  "name": "Updated Vendor Name",
  "description": "Updated description"
}
```

#### Delete Vendor

```http
DELETE /vendor/:id
```

### User Endpoints

#### Get User Profile

```http
GET /user/profile
```

#### Update User Profile

```http
PUT /user/profile
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}
```

### Upload Endpoints

#### Upload File

```http
POST /upload
Content-Type: multipart/form-data

file: <file_data>
```

**Response:**

```json
{
	"url": "https://res.cloudinary.com/example/image/upload/v123/image.jpg",
	"publicId": "image_public_id"
}
```

### Health Check

```http
GET /health
```

**Response:**

```json
{
	"status": "ok",
	"timestamp": "2024-01-15T10:30:00.000Z",
	"service": "gateway"
}
```

## WebSocket Gateway API

### Connection

```javascript
// Connect to WebSocket gateway
const socket = io('ws://localhost:5004');

// Authenticate with JWT token
socket.emit('authenticate', { token: 'jwt_token' });
```

### Location Events

#### Join Location Room

```javascript
socket.emit('join-location', { vendorId: 'vendor-123' });
```

#### Leave Location Room

```javascript
socket.emit('leave-location', { vendorId: 'vendor-123' });
```

#### Update Location

```javascript
socket.emit('update-location', {
	vendorId: 'vendor-123',
	lat: 40.7128,
	long: -74.006,
});
```

#### Location Updates (Receive)

```javascript
socket.on('location-updated', (data) => {
	console.log('Location updated:', data);
	// {
	//   vendorId: 'vendor-123',
	//   lat: 40.7128,
	//   long: -74.0060,
	//   timestamp: '2024-01-15T10:30:00.000Z'
	// }
});
```

## gRPC Services

### Vendor Service (Port 5005)

#### Service Definition

```protobuf
service VendorService {
  rpc GetVendorById(GetVendorByIdRequest) returns (Vendor);
  rpc CreateVendor(CreateVendorRequest) returns (Vendor);
  rpc UpdateVendor(UpdateVendorRequest) returns (Vendor);
  rpc DeleteVendor(DeleteVendorRequest) returns (DeleteVendorResponse);
  rpc GetVendors(GetVendorsRequest) returns (GetVendorsResponse);
}
```

#### Request/Response Types

```protobuf
message GetVendorByIdRequest {
  string id = 1;
}

message CreateVendorRequest {
  string name = 1;
  optional string description = 2;
  optional string phone = 3;
  optional string email = 4;
  optional string website = 5;
  optional double lat = 6;
  optional double long = 7;
  string userId = 8;
}

message UpdateVendorRequest {
  string id = 1;
  optional string name = 2;
  optional string description = 3;
  optional string phone = 4;
  optional string email = 5;
  optional string website = 6;
  optional double lat = 7;
  optional double long = 8;
}
```

### User Service (Port 5000)

#### Service Definition

```protobuf
service UserService {
  rpc GetUserById(GetUserByIdRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc UpdateUser(UpdateUserRequest) returns (User);
  rpc DeleteUser(DeleteUserRequest) returns (DeleteUserResponse);
  rpc GetUserVendors(GetUserVendorsRequest) returns (GetUserVendorsResponse);
}
```

### Location Service (Port 5001)

#### Service Definition

```protobuf
service LocationService {
  rpc UpdateVendorLocation(UpdateVendorLocationRequest) returns (Location);
  rpc GetVendorLocations(GetVendorLocationsRequest) returns (GetVendorLocationsResponse);
}
```

## Webhook Endpoints

### Clerk Webhooks

#### User Created

```http
POST /webhook/clerk/user-created
Content-Type: application/json
X-Svix-Signature: <signature>
X-Svix-Timestamp: <timestamp>
X-Svix-Id: <id>

{
  "data": {
    "id": "user_123",
    "email_addresses": [{"email_address": "user@example.com"}],
    "first_name": "John",
    "last_name": "Doe"
  },
  "object": "event",
  "type": "user.created"
}
```

#### User Deleted

```http
POST /webhook/clerk/user-deleted
Content-Type: application/json
X-Svix-Signature: <signature>
X-Svix-Timestamp: <timestamp>
X-Svix-Id: <id>

{
  "data": {
    "id": "user_123"
  },
  "object": "event",
  "type": "user.deleted"
}
```

### RevenueCat Webhooks

#### Subscription Created

```http
POST /webhook/subscription/created
Content-Type: application/json

{
  "api_version": "1.0",
  "event": {
    "type": "INITIAL_PURCHASE",
    "id": "event_id",
    "app_user_id": "user_123",
    "product_id": "premium_monthly",
    "period_type": "normal",
    "purchased_at_ms": 1642234567890,
    "expires_at_ms": 1644826567890
  }
}
```

## Error Responses

### Standard Error Format

```json
{
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Invalid input data",
		"details": {
			"field": "name",
			"errors": ["Name is required"]
		},
		"path": "/vendor",
		"requestId": "req_123",
		"timestamp": "2024-01-15T10:30:00.000Z"
	}
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default**: 100 requests per minute per IP
- **Authentication endpoints**: 10 requests per minute per IP
- **Upload endpoints**: 20 requests per minute per IP

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @your-org/api-client
```

```javascript
import { ApiClient } from '@your-org/api-client';

const client = new ApiClient({
	baseUrl: 'http://localhost:5002',
	token: 'jwt_token',
});

// Get vendor
const vendor = await client.vendors.getById('vendor-123');

// Create vendor
const newVendor = await client.vendors.create({
	name: 'New Vendor',
	description: 'A new vendor',
});
```

### Python

```bash
pip install venta-api-client
```

```python
from venta_api_client import VentaClient

client = VentaClient(
    base_url='http://localhost:5002',
    token='jwt_token'
)

# Get vendor
vendor = client.vendors.get_by_id('vendor-123')

# Create vendor
new_vendor = client.vendors.create({
    'name': 'New Vendor',
    'description': 'A new vendor'
})
```

## Testing

### Postman Collection

Import the Venta API Postman collection for testing:

```bash
# Download collection
curl -o api-collection.json \
  https://raw.githubusercontent.com/your-org/api/main/postman/collection.json
```

### API Testing with curl

```bash
# Get vendor
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5002/vendor/vendor-123

# Create vendor
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Vendor"}' \
  http://localhost:5002/vendor

# Upload file
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@image.jpg" \
  http://localhost:5002/upload
```
