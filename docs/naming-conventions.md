# Naming Conventions

## Overview

This document establishes consistent naming conventions across the Venta backend system to ensure code readability, maintainability, and developer experience.

## File and Directory Naming

### **Services and Applications**
- **Use kebab-case** for service names and directories
- **Examples**: `user-service`, `vendor-service`, `location-service`
- **Current**: `websocket-gateway`, `algolia-sync` ✅

### **Modules and Libraries**
- **Use kebab-case** for module directories
- **Examples**: `nest-modules`, `api-types`, `proto-definitions`
- **Current**: `nest/modules`, `apitypes`, `proto` ✅

### **TypeScript Files**
- **Use kebab-case** for file names
- **Examples**: `user-service.ts`, `vendor-controller.ts`, `location-schema.ts`
- **Current**: `user.service.ts`, `vendor.controller.ts` ✅

### **Protocol Buffer Files**
- **Use kebab-case** for proto files
- **Examples**: `user-service.proto`, `vendor-events.proto`
- **Current**: `user.proto`, `vendor.proto` ✅

## Code Naming Conventions

### **Classes and Interfaces**
- **Use PascalCase** for classes, interfaces, and types
- **Examples**: `UserService`, `VendorController`, `LocationSchema`
- **Current**: `UserService`, `VendorController` ✅

### **Functions and Methods**
- **Use camelCase** for functions and methods
- **Examples**: `createUser()`, `updateVendor()`, `getLocationById()`
- **Current**: `createUser()`, `updateVendor()` ✅

### **Variables and Properties**
- **Use camelCase** for variables and object properties
- **Examples**: `userId`, `vendorName`, `locationData`
- **Current**: `userId`, `vendorName` ✅

### **Constants**
- **Use UPPER_SNAKE_CASE** for constants
- **Examples**: `USER_SERVICE_NAME`, `VENDOR_PACKAGE_NAME`
- **Current**: `USER_SERVICE_NAME`, `VENDOR_PACKAGE_NAME` ✅

### **Environment Variables**
- **Use UPPER_SNAKE_CASE** for environment variables
- **Examples**: `DATABASE_URL`, `REDIS_PASSWORD`, `GATEWAY_SERVICE_PORT`
- **Current**: `DATABASE_URL`, `GATEWAY_SERVICE_PORT` ✅

## Database Naming

### **Tables**
- **Use snake_case** for table names
- **Examples**: `user`, `vendor`, `user_subscription`
- **Current**: `user`, `vendor`, `user_subscription` ✅

### **Columns**
- **Use snake_case** for column names
- **Examples**: `user_id`, `vendor_name`, `created_at`
- **Current**: `userId`, `vendorName`, `createdAt` (needs update)

### **Indexes**
- **Use snake_case** with descriptive names
- **Examples**: `idx_user_email`, `idx_vendor_owner_id`
- **Current**: Follows this pattern ✅

## API Naming

### **REST Endpoints**
- **Use kebab-case** for URL paths
- **Examples**: `/api/users`, `/api/vendors`, `/api/user-subscriptions`
- **Current**: `/user`, `/vendor` ✅

### **gRPC Services**
- **Use PascalCase** for service names
- **Examples**: `UserService`, `VendorService`, `LocationService`
- **Current**: `UserService`, `VendorService` ✅

### **gRPC Methods**
- **Use camelCase** for method names
- **Examples**: `createUser`, `updateVendor`, `getLocationById`
- **Current**: `createUser`, `updateVendor` ✅

## Event Naming

### **Event Subjects**
- **Use dot notation** with lowercase
- **Examples**: `user.created`, `vendor.updated`, `location.changed`
- **Current**: `user.created`, `vendor.updated` ✅

### **Event Types**
- **Use PascalCase** with "Event" suffix
- **Examples**: `UserCreatedEvent`, `VendorUpdatedEvent`
- **Current**: `UserCreatedEvent`, `VendorUpdatedEvent` ✅

## Configuration Naming

### **Module Names**
- **Use PascalCase** with "Module" suffix
- **Examples**: `UserModule`, `VendorModule`, `BootstrapModule`
- **Current**: `UserModule`, `VendorModule` ✅

### **Service Names**
- **Use PascalCase** with "Service" suffix
- **Examples**: `UserService`, `VendorService`, `LoggerService`
- **Current**: `UserService`, `VendorService` ✅

### **Controller Names**
- **Use PascalCase** with "Controller" suffix
- **Examples**: `UserController`, `VendorController`
- **Current**: `UserController`, `VendorController` ✅

## Import Organization

### **Import Order**
1. **Node.js built-ins** (fs, path, etc.)
2. **Third-party libraries** (NestJS, etc.)
3. **Internal shared libraries** (@app/nest/modules, etc.)
4. **Relative imports** (./user.service, etc.)

### **Import Examples**
```typescript
// Node.js built-ins
import { randomUUID } from 'crypto';

// Third-party libraries
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Internal shared libraries
import { PrismaService, EventService } from '@app/nest/modules';
import { UserCreateSchema } from '@app/apitypes';

// Relative imports
import { UserController } from './user.controller';
import { UserService } from './user.service';
```

## Package and Dependency Naming

### **Package Names**
- **Use kebab-case** for package names
- **Examples**: `@venta/backend`, `@venta/api-types`
- **Current**: `backend` (needs update)

### **Dependency Names**
- **Use original package names** as published
- **Examples**: `@nestjs/common`, `@prisma/client`
- **Current**: `@nestjs/common`, `@prisma/client` ✅

## Documentation Naming

### **Documentation Files**
- **Use kebab-case** for documentation files
- **Examples**: `development-guide.md`, `deployment-guide.md`
- **Current**: `development-guide.md`, `deployment-guide.md` ✅

### **Documentation Sections**
- **Use Title Case** for section headers
- **Examples**: `## Quick Start`, `### Service Configuration`
- **Current**: `## Quick Start`, `### Service Configuration` ✅

## Migration Plan

### **Phase 1: Database Column Names**
- Update Prisma schema to use snake_case for column names
- Create migration scripts for existing databases
- Update all references in code

### **Phase 2: Package Names**
- Update package.json to use kebab-case
- Update all import references
- Update documentation

### **Phase 3: File Names**
- Rename files to follow kebab-case convention
- Update all import statements
- Update build configurations

## Enforcement

### **ESLint Rules**
- Configure ESLint to enforce naming conventions
- Add rules for consistent naming patterns
- Set up pre-commit hooks

### **Code Review**
- Include naming convention checks in code reviews
- Use automated tools to catch violations
- Provide clear feedback on naming issues

## Benefits

- **Improved readability** with consistent naming patterns
- **Better developer experience** with predictable conventions
- **Reduced confusion** when working across different parts of the system
- **Easier onboarding** for new developers
- **Better tooling support** with consistent patterns 