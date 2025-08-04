# Algolia Module

## Purpose

The Algolia module provides search functionality and index management for the Venta backend system. It includes Algolia client integration, search operations, and index synchronization capabilities.

## What It Contains

- **Algolia Service**: Main search service with Algolia client integration
- **Search Operations**: Search queries and filtering
- **Index Management**: Index creation, updates, and deletion
- **Data Synchronization**: Real-time index synchronization

## Usage

This module is imported by services that need search functionality or index management capabilities.

### For Services
```typescript
// Import the Algolia module in your service module
import { AlgoliaModule } from '@app/nest/modules/algolia';

@Module({
  imports: [AlgoliaModule],
  // ... other module configuration
})
export class MyServiceModule {}
```

### For Search Operations
```typescript
// Inject the Algolia service in your service
import { AlgoliaService } from '@app/nest/modules/algolia';

@Injectable()
export class MyService {
  constructor(private readonly algoliaService: AlgoliaService) {}

  async searchVendors(query: string) {
    return this.algoliaService.search('vendor', {
      query,
      filters: 'status:active',
      hitsPerPage: 20
    });
  }

  async updateVendorIndex(vendorData: any) {
    return this.algoliaService.updateRecord('vendor', vendorData.id, vendorData);
  }

  async deleteVendorFromIndex(vendorId: string) {
    return this.algoliaService.deleteRecord('vendor', vendorId);
  }
}
```

### For Index Management
```typescript
// Create a new index
await this.algoliaService.createIndex('new-index');

// Configure index settings
await this.algoliaService.setIndexSettings('vendor', {
  searchableAttributes: ['name', 'description', 'tags'],
  attributesForFaceting: ['category', 'location']
});
```

## Key Benefits

- **Search Performance**: Fast and scalable search capabilities
- **Real-time Updates**: Automatic index synchronization
- **Advanced Filtering**: Complex search queries and filtering
- **Analytics**: Search analytics and insights

## Dependencies

- Algolia search service
- NestJS framework
- TypeScript for type definitions 