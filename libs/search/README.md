# Search Library

This library provides search functionality and indexing utilities for the Venta backend services.

## Overview

The search library integrates with Algolia to provide powerful search capabilities, including indexing, querying, and search result management. It offers a clean interface for implementing search functionality across the application.

## Features

- **Search Indexing**: Index and update searchable content
- **Search Queries**: Perform complex search queries with filtering and sorting
- **Algolia Integration**: Full integration with Algolia search service
- **Content Synchronization**: Keep search indices in sync with data changes
- **Search Analytics**: Track search performance and user behavior

## Usage

### Search Indexing

Index content to make it searchable across the application.

```typescript
import { AlgoliaService } from '@app/search';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
	constructor(private readonly algolia: AlgoliaService) {}

	async createProduct(productData: CreateProductInput) {
		const product = await this.prisma.product.create({ data: productData });

		// Index the product for search
		await this.algolia.index('products', {
			objectID: product.id,
			name: product.name,
			description: product.description,
			category: product.category,
			price: product.price,
			tags: product.tags,
		});

		return product;
	}

	async updateProduct(id: string, updates: UpdateProductInput) {
		const product = await this.prisma.product.update({
			where: { id },
			data: updates,
		});

		// Update search index
		await this.algolia.update('products', {
			objectID: product.id,
			name: product.name,
			description: product.description,
			category: product.category,
			price: product.price,
			tags: product.tags,
		});

		return product;
	}
}
```

### Search Queries

Perform search queries with advanced filtering, sorting, and pagination.

```typescript
import { AlgoliaService } from '@app/search';

@Injectable()
export class SearchService {
	constructor(private readonly algolia: AlgoliaService) {}

	async searchProducts(query: string, filters?: SearchFilters) {
		const searchParams = {
			query,
			filters: this.buildFilters(filters),
			hitsPerPage: 20,
			page: 0,
		};

		const results = await this.algolia.search('products', searchParams);

		return {
			hits: results.hits,
			totalHits: results.nbHits,
			totalPages: Math.ceil(results.nbHits / 20),
		};
	}

	private buildFilters(filters?: SearchFilters): string {
		if (!filters) return '';

		const filterParts = [];
		if (filters.category) filterParts.push(`category:${filters.category}`);
		if (filters.minPrice) filterParts.push(`price >= ${filters.minPrice}`);
		if (filters.maxPrice) filterParts.push(`price <= ${filters.maxPrice}`);

		return filterParts.join(' AND ');
	}
}
```

### Content Management

Keep search indices synchronized with your data as it changes.

```typescript
import { AlgoliaService } from '@app/search';

@Injectable()
export class ProductSyncService {
	constructor(private readonly algolia: AlgoliaService) {}

	async syncAllProducts() {
		const products = await this.prisma.product.findMany();

		const objects = products.map((product) => ({
			objectID: product.id,
			name: product.name,
			description: product.description,
			category: product.category,
			price: product.price,
			tags: product.tags,
		}));

		await this.algolia.batchIndex('products', objects);
	}

	async deleteProduct(id: string) {
		await this.prisma.product.delete({ where: { id } });
		await this.algolia.delete('products', id);
	}
}
```

## Dependencies

- Algolia for search functionality
- NestJS for framework integration
