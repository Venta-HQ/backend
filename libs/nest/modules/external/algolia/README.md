# Algolia Module

## Purpose

The Algolia module provides search functionality and index management for the Venta backend system. It includes Algolia client integration, search operations, index synchronization, and advanced search capabilities for fast and scalable search functionality.

## Overview

This module provides:
- Algolia client integration and configuration
- Search operations with advanced querying and filtering
- Index management and optimization
- Real-time index synchronization
- Search analytics and insights
- Type-safe search operations

## Usage

### Module Registration

Register the Algolia module in your service:

```typescript
import { AlgoliaModule } from '@app/nest/modules/algolia';

@Module({
  imports: [AlgoliaModule.register()],
  // ... other module configuration
})
export class YourServiceModule {}
```

### Service Injection

Inject AlgoliaService for search operations:

```typescript
import { AlgoliaService } from '@app/nest/modules/algolia';

@Injectable()
export class YourService {
  constructor(private readonly algoliaService: AlgoliaService) {}

  async searchVendors(query: string) {
    return this.algoliaService.search('vendor', {
      query,
      filters: 'status:active',
      hitsPerPage: 20
    });
  }

  async searchUsers(query: string) {
    return this.algoliaService.search('user', {
      query,
      filters: 'isActive:true',
      hitsPerPage: 10
    });
  }
}
```

### Index Management

Manage search indices:

```typescript
// Update records in index
async updateVendorIndex(vendorData: any) {
  return this.algoliaService.updateRecord('vendor', vendorData.id, vendorData);
}

// Delete records from index
async deleteVendorFromIndex(vendorId: string) {
  return this.algoliaService.deleteRecord('vendor', vendorId);
}

// Create new index
async createNewIndex(indexName: string) {
  return this.algoliaService.createIndex(indexName);
}

// Configure index settings
async configureIndex(indexName: string, settings: any) {
  return this.algoliaService.setIndexSettings(indexName, settings);
}
```

### Advanced Search

Perform advanced search operations:

```typescript
// Search with filters
async searchWithFilters(query: string, filters: string) {
  return this.algoliaService.search('vendor', {
    query,
    filters,
    hitsPerPage: 20,
    page: 0
  });
}

// Search with facets
async searchWithFacets(query: string, facets: string[]) {
  return this.algoliaService.search('vendor', {
    query,
    facets,
    hitsPerPage: 20
  });
}

// Search with geolocation
async searchNearby(lat: number, lng: number, radius: number) {
  return this.algoliaService.search('vendor', {
    aroundLatLng: `${lat},${lng}`,
    aroundRadius: radius,
    hitsPerPage: 20
  });
}
```

### Batch Operations

Perform batch operations for efficiency:

```typescript
// Batch update records
async batchUpdateVendors(vendors: any[]) {
  return this.algoliaService.batchUpdate('vendor', vendors);
}

// Batch delete records
async batchDeleteVendors(vendorIds: string[]) {
  return this.algoliaService.batchDelete('vendor', vendorIds);
}
```

### Environment Configuration

Configure Algolia with environment variables:

```env
# Algolia Configuration
ALGOLIA_APP_ID=your-algolia-app-id
ALGOLIA_API_KEY=your-algolia-api-key
ALGOLIA_ADMIN_API_KEY=your-algolia-admin-api-key

# Index Configuration
ALGOLIA_VENDOR_INDEX_NAME=vendors
ALGOLIA_USER_INDEX_NAME=users
```

## Key Benefits

- **Search Performance**: Fast and scalable search capabilities
- **Real-time Updates**: Automatic index synchronization
- **Advanced Filtering**: Complex search queries and filtering
- **Analytics**: Search analytics and insights
- **Type Safety**: Type-safe search operations
- **Scalability**: Handles large datasets efficiently
- **Flexibility**: Configurable search behavior

## Dependencies

- **Algolia** for search service and index management
- **NestJS** for module framework and dependency injection
- **TypeScript** for type definitions 