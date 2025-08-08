# API Types Library

## Purpose

The API Types library provides shared type definitions and validation schemas that are used across multiple domains in the Venta backend system. This library focuses on truly shared, non-domain-specific types that are needed by multiple parts of the system.

## Overview

This library provides:

- **Shared types** for common functionality across domains
- **Validation schemas** using Zod for runtime type checking
- **Helper functions** for common type operations
- **Cross-domain utilities** for shared functionality

## Organization

### Library Structure

```
libs/apitypes/src/
├── shared/
│   └── helpers/               # Shared helper functions
│       ├── helpers.ts
│       └── index.ts
└── index.ts                   # Main export file
```

### Domain-Specific Types

Domain-specific types have been moved to their respective domain folders:

- Marketplace types → `domains/marketplace/contracts/types`
- Location Services types → `domains/location-services/contracts/types`
- Communication types → `domains/communication/contracts/types`
- Infrastructure types → `domains/infrastructure/contracts/types`

## Usage

### Importing Shared Types

```typescript
import { BaseResponse, CommonFilters, PaginatedResult } from '@app/apitypes';

// Use shared types for common patterns
interface UserListResponse extends PaginatedResult<User> {
	totalCount: number;
}
```

### Using Helper Functions

```typescript
import { createPagination, formatResponse, validateId } from '@app/apitypes/shared/helpers';

// Use shared helper functions
const pagination = createPagination(page, limit);
```

## Benefits

- **Clear separation** between shared and domain-specific types
- **Reduced duplication** through shared utilities
- **Consistent patterns** for common operations
- **Type safety** across all microservices
- **Focused scope** on truly shared functionality
- **Better maintainability** through proper separation of concerns
