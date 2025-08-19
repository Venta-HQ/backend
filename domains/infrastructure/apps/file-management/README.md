# File Management Service

## Purpose

The File Management service handles all file upload and storage operations in the Venta backend system. It manages image uploads for user profiles and vendor images, providing secure file storage and retrieval capabilities. This service serves as the central authority for file operations and exposes a gRPC API consumed by the API Gateway.

## Overview

This microservice provides:

- Image upload functionality for user profiles and vendor images (via gRPC)
- Secure file storage and retrieval with cloud storage integration
- File validation, processing, and optimization
- File metadata management and organization
- Cloud storage integration for scalable file management
- File access control and security
- Image processing and optimization
- File upload event publishing

## Key Responsibilities

- **File Uploads**: Handles secure file uploads with validation and processing
- **Image Processing**: Processes and optimizes uploaded images
- **Storage Management**: Manages file storage in cloud storage systems
- **File Validation**: Validates file types, sizes, and content
- **Access Control**: Manages file access permissions and security
- **Metadata Management**: Tracks file metadata and organization
- **Event Publishing**: Publishes file-related events for other services
- **Cloud Integration**: Integrates with cloud storage providers

## Architecture

The service follows a domain-driven design approach, focusing specifically on file management business logic. It exposes a gRPC API for file operations and publishes events for asynchronous communication with the rest of the system.

### Service Structure

```
File Management Service
├── Controllers (gRPC)
│   └── FileManagementController - gRPC entrypoints
├── Services
│   └── FileManagementService - File upload and storage logic
└── Module Configuration
    └── BootstrapModule - Standardized service bootstrapping
```

## Usage

### Starting the Service

```bash
# Development mode
pnpm run start:dev file-management

# Production mode
pnpm run start:prod file-management

# With Docker
docker-compose up file-management
```

### Environment Configuration

```env
# Service Configuration
FILE_MANAGEMENT_SERVICE_ADDRESS=0.0.0.0:5005
FILE_MANAGEMENT_HEALTH_PORT=3015

# Cloud Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# File Upload Limits
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/venta

# Redis
REDIS_PASSWORD=your-redis-password

# NATS
NATS_URL=nats://localhost:4222
```

### Service Patterns

The service follows these patterns:

- **BootstrapModule**: Uses the standardized BootstrapModule for service configuration
- **gRPC Controllers**: Exposes gRPC endpoints for file upload operations
- **File Processing**: Handles file validation, processing, and storage
- **Event Publishing**: Publishes events to NATS for other services to consume
- **Database Operations**: Uses PrismaService for database access via `prisma.db`
- **Error Handling**: Uses standardized AppError patterns for consistent error responses

### Integration Points

- **Cloud Storage**: Integrates with Cloudinary for file storage and processing
- **Event System**: Publishes file upload events for other services
- **Database**: Stores file metadata and access information
- **HTTP API**: Provides RESTful endpoints for file operations

## gRPC API

See protobuf definition in `libs/proto/src/definitions/domains/infrastructure/file-management.proto` for service methods and messages.

## Development

### Local Development

1. Set up environment variables
2. Start the service: `pnpm run start:dev file-management`
3. Test file uploads via the API endpoints

### Testing

```bash
# Run tests
pnpm run test file-management

# Run tests with coverage
pnpm run test:cov file-management
```

### Building

```bash
# Build the service
pnpm run build file-management

# Build for production
pnpm run build:prod file-management
```

## Deployment

The service is containerized using Docker and can be deployed using:

```bash
# Build Docker image
docker build -t venta-file-management .

# Run container
docker run -p 3005:3005 venta-file-management
```

## Monitoring

The service includes:

- Health check endpoints
- Prometheus metrics
- Structured logging
- Error tracking and monitoring
