# Algolia Sync Service

## Purpose

The Algolia Sync service manages the synchronization of data between the Venta backend system and Algolia search indices. It handles real-time data updates, maintains search index consistency, and ensures that search results remain accurate and up-to-date. This service serves as the bridge between the application's database and Algolia's search infrastructure, providing fast and relevant search capabilities across the platform.

## Overview

This service provides:
- Real-time synchronization of vendor and user data with Algolia indices
- Event-driven data updates with automatic index management
- Batch processing for large-scale data synchronization
- Search index optimization and performance tuning
- Data transformation and normalization for search optimization
- Error handling and retry mechanisms for reliable synchronization
- Manual sync operations for data recovery and maintenance
- Health monitoring and synchronization status tracking

## Key Responsibilities

- **Data Synchronization**: Maintains real-time sync between database and Algolia indices
- **Event Processing**: Listens to events from other services and updates search indices accordingly
- **Index Management**: Creates, updates, and optimizes Algolia search indices
- **Data Transformation**: Transforms database records into search-optimized formats
- **Batch Operations**: Handles bulk data operations for performance and efficiency
- **Error Recovery**: Implements retry logic and error handling for failed operations
- **Performance Optimization**: Optimizes search indices for fast and relevant results
- **Monitoring**: Tracks synchronization status and performance metrics

## Architecture

The service follows an event-driven architecture pattern, where it listens for events from other services and automatically updates the corresponding Algolia indices. It maintains data consistency and provides reliable search functionality.

### Service Structure

```
Algolia Sync Service
├── Controllers
│   └── Algolia Sync Controller - Manual sync operations
├── Services
│   └── Algolia Sync Service - Sync logic and index management
└── Module Configuration
    └── AlgoliaModule - Algolia integration and configuration
```

## Usage

### Starting the Service

```bash
# Development mode
pnpm run start:dev algolia-sync

# Production mode
pnpm run start:prod algolia-sync

# With Docker
docker-compose up algolia-sync
```

### Environment Configuration

```env
# Service Configuration
ALGOLIA_SYNC_SERVICE_PORT=5006
ALGOLIA_SYNC_HEALTH_PORT=5016

# Algolia Configuration
ALGOLIA_APP_ID=your-algolia-app-id
ALGOLIA_API_KEY=your-algolia-api-key
ALGOLIA_ADMIN_API_KEY=your-algolia-admin-api-key

# Index Configuration
ALGOLIA_VENDOR_INDEX_NAME=vendors
ALGOLIA_USER_INDEX_NAME=users
ALGOLIA_SEARCH_INDEX_NAME=search

# Sync Settings
ALGOLIA_BATCH_SIZE=100
ALGOLIA_SYNC_DELAY=1000
ALGOLIA_MAX_RETRIES=3

# NATS
NATS_URL=nats://localhost:4222
```

### Service Patterns

The service follows these patterns:

- **Event-Driven**: Listens to events from other services for automatic synchronization
- **Batch Processing**: Handles large data sets efficiently with batch operations
- **Retry Logic**: Implements automatic retry mechanisms for failed operations
- **Data Transformation**: Converts database records to search-optimized formats
- **Index Management**: Maintains and optimizes Algolia search indices
- **Error Handling**: Provides comprehensive error handling and recovery

### Integration Points

- **Vendor Service**: Receives vendor creation, update, and deletion events
- **User Service**: Receives user profile and status change events
- **Event System**: Subscribes to events from all services for synchronization
- **Algolia**: Manages search indices and data synchronization
- **Database**: Reads data for manual sync operations and data recovery

## Dependencies

- **AlgoliaModule** for Algolia integration and search operations
- **NatsQueueModule** for event subscription and processing
- **Event System** for receiving real-time events from other services
- **Algolia** for search index management and data synchronization
